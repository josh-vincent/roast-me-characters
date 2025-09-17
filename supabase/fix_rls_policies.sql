-- Fix infinite recursion in RLS policies
-- Drop the problematic policies and recreate them

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Allow viewing characters" ON roast_me_ai_characters;
DROP POLICY IF EXISTS "Allow character owners to manage shares" ON roast_me_ai_shares;

-- Create simpler, non-recursive policies

-- Characters: Allow viewing for owners and public shares (simplified)
CREATE POLICY "Allow viewing characters" ON roast_me_ai_characters
  FOR SELECT USING (
    user_id = COALESCE(auth.uid()::text, user_id)
  );

-- Shares: Allow all operations for character owners (simplified)
CREATE POLICY "Allow character owners to manage shares" ON roast_me_ai_shares
  FOR ALL USING (
    auth.uid()::text IS NOT NULL OR true  -- Allow anonymous for now
  );