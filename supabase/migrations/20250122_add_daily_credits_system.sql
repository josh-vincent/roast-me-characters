-- Add daily credit system to support 3 free credits per day
-- This migration adds tracking for daily credit usage and purchased credits

-- First, create the profiles table if it doesn't exist
-- This table extends Supabase Auth users with app-specific data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Credit system fields
  daily_credits_used INTEGER DEFAULT 0 CHECK (daily_credits_used >= 0 AND daily_credits_used <= 3),
  daily_credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  lifetime_credits_purchased INTEGER DEFAULT 0 CHECK (lifetime_credits_purchased >= 0),
  credits INTEGER DEFAULT 0 CHECK (credits >= 0), -- Current purchased credits balance
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add columns to existing profiles table if it already exists
DO $$ 
BEGIN
  -- Add daily_credits_used if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'daily_credits_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_credits_used INTEGER DEFAULT 0 
      CHECK (daily_credits_used >= 0 AND daily_credits_used <= 3);
  END IF;

  -- Add daily_credits_reset_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'daily_credits_reset_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_credits_reset_at TIMESTAMP WITH TIME ZONE 
      DEFAULT CURRENT_TIMESTAMP;
  END IF;

  -- Add lifetime_credits_purchased if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'lifetime_credits_purchased'
  ) THEN
    ALTER TABLE profiles ADD COLUMN lifetime_credits_purchased INTEGER DEFAULT 0 
      CHECK (lifetime_credits_purchased >= 0);
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_daily_reset ON profiles(daily_credits_reset_at);
CREATE INDEX IF NOT EXISTS idx_profiles_credits ON profiles(credits, daily_credits_used);

-- Function to check if daily credits should be reset
CREATE OR REPLACE FUNCTION should_reset_daily_credits(reset_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
  -- Reset if the reset timestamp is before today (in the user's timezone or UTC)
  RETURN reset_timestamp < DATE_TRUNC('day', CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to reset daily credits for a user
CREATE OR REPLACE FUNCTION reset_daily_credits(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    daily_credits_used = 0,
    daily_credits_reset_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = user_id
    AND should_reset_daily_credits(daily_credits_reset_at);
END;
$$ LANGUAGE plpgsql;

-- Function to use credits (daily first, then purchased)
CREATE OR REPLACE FUNCTION use_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  daily_used INTEGER,
  purchased_used INTEGER,
  daily_remaining INTEGER,
  purchased_remaining INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_profile RECORD;
  v_daily_available INTEGER;
  v_daily_to_use INTEGER;
  v_purchased_to_use INTEGER;
BEGIN
  -- First, reset daily credits if needed
  PERFORM reset_daily_credits(p_user_id);
  
  -- Get current profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      0::INTEGER,
      0::INTEGER,
      0::INTEGER,
      0::INTEGER,
      'User profile not found'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate available daily credits (3 per day minus what's used)
  v_daily_available := 3 - v_profile.daily_credits_used;
  
  -- Check if user has enough credits (daily + purchased)
  IF v_daily_available + v_profile.credits < p_amount THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      0::INTEGER,
      0::INTEGER,
      v_daily_available::INTEGER,
      v_profile.credits::INTEGER,
      'Insufficient credits'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate how many daily vs purchased credits to use
  IF v_daily_available >= p_amount THEN
    -- Use only daily credits
    v_daily_to_use := p_amount;
    v_purchased_to_use := 0;
  ELSE
    -- Use all available daily credits, rest from purchased
    v_daily_to_use := v_daily_available;
    v_purchased_to_use := p_amount - v_daily_available;
  END IF;
  
  -- Update profile
  UPDATE profiles
  SET 
    daily_credits_used = daily_credits_used + v_daily_to_use,
    credits = credits - v_purchased_to_use,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    description,
    payment_status,
    metadata
  ) VALUES (
    p_user_id,
    -p_amount,
    'usage',
    COALESCE(p_reason, 'Character generation'),
    'completed',
    jsonb_build_object(
      'daily_used', v_daily_to_use,
      'purchased_used', v_purchased_to_use,
      'daily_remaining', v_daily_available - v_daily_to_use,
      'purchased_remaining', v_profile.credits - v_purchased_to_use
    )
  );
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    v_daily_to_use::INTEGER,
    v_purchased_to_use::INTEGER,
    (v_daily_available - v_daily_to_use)::INTEGER,
    (v_profile.credits - v_purchased_to_use)::INTEGER,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get credit balance (with auto-reset)
CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id UUID)
RETURNS TABLE (
  daily_available INTEGER,
  daily_used INTEGER,
  purchased_credits INTEGER,
  total_available INTEGER,
  next_reset_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Reset daily credits if needed
  PERFORM reset_daily_credits(p_user_id);
  
  -- Return current balance
  RETURN QUERY
  SELECT 
    (3 - COALESCE(p.daily_credits_used, 0))::INTEGER as daily_available,
    COALESCE(p.daily_credits_used, 0)::INTEGER as daily_used,
    COALESCE(p.credits, 0)::INTEGER as purchased_credits,
    ((3 - COALESCE(p.daily_credits_used, 0)) + COALESCE(p.credits, 0))::INTEGER as total_available,
    DATE_TRUNC('day', CURRENT_TIMESTAMP) + INTERVAL '1 day' as next_reset_time
  FROM profiles p
  WHERE p.id = p_user_id;
  
  -- If user doesn't exist, return default values
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      3::INTEGER,
      0::INTEGER,
      0::INTEGER,
      3::INTEGER,
      DATE_TRUNC('day', CURRENT_TIMESTAMP) + INTERVAL '1 day';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (but not credit fields directly)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent direct credit manipulation
    (OLD.credits IS NOT DISTINCT FROM NEW.credits) AND
    (OLD.daily_credits_used IS NOT DISTINCT FROM NEW.daily_credits_used) AND
    (OLD.lifetime_credits_purchased IS NOT DISTINCT FROM NEW.lifetime_credits_purchased)
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update credit_transactions to include credit type tracking
ALTER TABLE credit_transactions 
ADD COLUMN IF NOT EXISTS credit_type VARCHAR(20) DEFAULT 'mixed' 
  CHECK (credit_type IN ('daily', 'purchased', 'mixed'));

ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS daily_credits_before INTEGER,
ADD COLUMN IF NOT EXISTS purchased_credits_before INTEGER;

-- Grant necessary permissions for functions
GRANT EXECUTE ON FUNCTION reset_daily_credits TO authenticated;
GRANT EXECUTE ON FUNCTION use_credits TO authenticated;
GRANT EXECUTE ON FUNCTION get_credit_balance TO authenticated;
GRANT EXECUTE ON FUNCTION should_reset_daily_credits TO authenticated;