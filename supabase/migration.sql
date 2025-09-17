-- Migration script to update database schema with proper table prefixes
-- Run this on your remote Supabase database

-- Step 1: Drop existing indexes and policies on old table names (if they exist)
DROP INDEX IF EXISTS idx_roast_me_ai_uploads_user_id;
DROP INDEX IF EXISTS idx_roast_me_ai_uploads_status;
DROP INDEX IF EXISTS idx_roast_me_ai_features_image_id;
DROP INDEX IF EXISTS idx_roast_me_ai_characters_user_id;
DROP INDEX IF EXISTS idx_roast_me_ai_characters_image_id;
DROP INDEX IF EXISTS idx_roast_me_ai_shares_character_id;

-- Drop old policies if they exist
DROP POLICY IF EXISTS uploads_insert_own ON roast_me_ai_image_uploads;
DROP POLICY IF EXISTS uploads_select_own ON roast_me_ai_image_uploads;
DROP POLICY IF EXISTS uploads_update_own ON roast_me_ai_image_uploads;
DROP POLICY IF EXISTS uploads_delete_own ON roast_me_ai_image_uploads;
DROP POLICY IF EXISTS features_select_own ON roast_me_ai_features;
DROP POLICY IF EXISTS characters_select ON roast_me_ai_characters;
DROP POLICY IF EXISTS characters_insert_own ON roast_me_ai_characters;
DROP POLICY IF EXISTS characters_update_own ON roast_me_ai_characters;
DROP POLICY IF EXISTS characters_delete_own ON roast_me_ai_characters;

-- Drop policies on old table names (legacy names without prefixes)
DROP POLICY IF EXISTS uploads_insert_own ON image_uploads;
DROP POLICY IF EXISTS uploads_select_own ON image_uploads;
DROP POLICY IF EXISTS uploads_update_own ON image_uploads;
DROP POLICY IF EXISTS uploads_delete_own ON image_uploads;
DROP POLICY IF EXISTS features_select_own ON ai_features;
DROP POLICY IF EXISTS characters_select ON characters_3d;
DROP POLICY IF EXISTS characters_insert_own ON characters_3d;
DROP POLICY IF EXISTS characters_update_own ON characters_3d;
DROP POLICY IF EXISTS characters_delete_own ON characters_3d;

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create tables with proper prefixes
CREATE TABLE IF NOT EXISTS roast_me_ai_image_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Using TEXT for simplified user tracking
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE TABLE IF NOT EXISTS roast_me_ai_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES roast_me_ai_image_uploads(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  feature_value TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  exaggeration_factor DECIMAL(3,1) CHECK (exaggeration_factor >= 1 AND exaggeration_factor <= 10)
);

CREATE TABLE IF NOT EXISTS roast_me_ai_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES roast_me_ai_image_uploads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- Using TEXT for simplified user tracking
  model_url TEXT,
  thumbnail_url TEXT,
  generation_params JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS roast_me_ai_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES roast_me_ai_characters(id) ON DELETE CASCADE,
  share_url TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_uploads_user_id ON roast_me_ai_image_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_uploads_status ON roast_me_ai_image_uploads(status);
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_features_image_id ON roast_me_ai_features(image_id);
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_characters_user_id ON roast_me_ai_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_characters_image_id ON roast_me_ai_characters(image_id);
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_shares_character_id ON roast_me_ai_shares(character_id);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE roast_me_ai_image_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_me_ai_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_me_ai_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_me_ai_shares ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies with proper table names
-- Allow public insert for image uploads (for anonymous uploads)
CREATE POLICY uploads_insert_public ON roast_me_ai_image_uploads
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own uploads (if user_id matches auth)
CREATE POLICY uploads_select_own ON roast_me_ai_image_uploads
  FOR SELECT USING (
    user_id = COALESCE(auth.uid()::text, user_id)
  );

-- Allow users to update their own uploads
CREATE POLICY uploads_update_own ON roast_me_ai_image_uploads
  FOR UPDATE USING (
    user_id = COALESCE(auth.uid()::text, user_id)
  );

-- Allow users to delete their own uploads
CREATE POLICY uploads_delete_own ON roast_me_ai_image_uploads
  FOR DELETE USING (
    user_id = COALESCE(auth.uid()::text, user_id)
  );

-- AI features are viewable by the image owner
CREATE POLICY features_select_own ON roast_me_ai_features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roast_me_ai_image_uploads
      WHERE roast_me_ai_image_uploads.id = roast_me_ai_features.image_id
      AND roast_me_ai_image_uploads.user_id = COALESCE(auth.uid()::text, roast_me_ai_image_uploads.user_id)
    )
  );

-- Allow public insert for features (for anonymous usage)
CREATE POLICY features_insert_public ON roast_me_ai_features
  FOR INSERT WITH CHECK (true);

-- Characters are viewable by owner and publicly shared ones
CREATE POLICY characters_select ON roast_me_ai_characters
  FOR SELECT USING (
    user_id = COALESCE(auth.uid()::text, user_id) OR
    EXISTS (
      SELECT 1 FROM roast_me_ai_shares
      WHERE roast_me_ai_shares.character_id = roast_me_ai_characters.id
      AND (roast_me_ai_shares.expires_at IS NULL OR roast_me_ai_shares.expires_at > NOW())
    )
  );

-- Allow public insert for characters (for anonymous usage)
CREATE POLICY characters_insert_public ON roast_me_ai_characters
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own characters
CREATE POLICY characters_update_own ON roast_me_ai_characters
  FOR UPDATE USING (
    user_id = COALESCE(auth.uid()::text, user_id)
  );

-- Allow users to delete their own characters
CREATE POLICY characters_delete_own ON roast_me_ai_characters
  FOR DELETE USING (
    user_id = COALESCE(auth.uid()::text, user_id)
  );

-- Allow public insert for shares (for anonymous usage)
CREATE POLICY shares_insert_public ON roast_me_ai_shares
  FOR INSERT WITH CHECK (true);

-- Allow public select for shares (so they can be accessed)
CREATE POLICY shares_select_public ON roast_me_ai_shares
  FOR SELECT USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_image_uploads TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_features TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_characters TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_shares TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;