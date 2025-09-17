-- Create users table for authentication and credit management
CREATE TABLE roast_me_ai_users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  google_id TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  credits INTEGER DEFAULT 3,
  images_created INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'unlimited')),
  polar_customer_id TEXT
);

-- Create indexes for performance
CREATE INDEX idx_roast_me_ai_users_email ON roast_me_ai_users(email);
CREATE INDEX idx_roast_me_ai_users_google_id ON roast_me_ai_users(google_id);
CREATE INDEX idx_roast_me_ai_users_is_anonymous ON roast_me_ai_users(is_anonymous);
CREATE INDEX idx_roast_me_ai_users_polar_customer_id ON roast_me_ai_users(polar_customer_id);

-- Enable RLS (Row Level Security)
ALTER TABLE roast_me_ai_users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only see and modify their own records
CREATE POLICY "Users can view own profile" ON roast_me_ai_users
  FOR SELECT
  USING (auth.uid()::text = id OR is_anonymous = true);

CREATE POLICY "Users can update own profile" ON roast_me_ai_users
  FOR UPDATE
  USING (auth.uid()::text = id OR is_anonymous = true);

CREATE POLICY "Users can insert own profile" ON roast_me_ai_users
  FOR INSERT
  WITH CHECK (auth.uid()::text = id OR is_anonymous = true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_roast_me_ai_users_updated_at
  BEFORE UPDATE ON roast_me_ai_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();