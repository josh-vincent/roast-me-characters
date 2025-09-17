-- Complete Roast Me AI Database Schema
-- ALL tables have roast_me_ai_ prefix for consistency
-- Run this on your Supabase database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing tables and policies (if they exist)
DROP TABLE IF EXISTS roast_me_ai_shares CASCADE;
DROP TABLE IF EXISTS roast_me_ai_characters CASCADE;
DROP TABLE IF EXISTS roast_me_ai_features CASCADE;
DROP TABLE IF EXISTS roast_me_ai_image_uploads CASCADE;
DROP TABLE IF EXISTS roast_me_ai_users CASCADE;

-- Also drop any legacy tables without prefixes
DROP TABLE IF EXISTS character_shares CASCADE;
DROP TABLE IF EXISTS characters_3d CASCADE;
DROP TABLE IF EXISTS ai_features CASCADE;
DROP TABLE IF EXISTS image_uploads CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- TABLE DEFINITIONS (All with roast_me_ai_ prefix)
-- =====================================================

-- Users table (for future authentication)
CREATE TABLE roast_me_ai_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image uploads table
CREATE TABLE roast_me_ai_image_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Using TEXT for simplified user tracking (can be UUID later)
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- AI detected features table
CREATE TABLE roast_me_ai_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES roast_me_ai_image_uploads(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  feature_value TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  exaggeration_factor DECIMAL(3,1) CHECK (exaggeration_factor >= 1 AND exaggeration_factor <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3D characters table
CREATE TABLE roast_me_ai_characters (
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

-- Character sharing table
CREATE TABLE roast_me_ai_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES roast_me_ai_characters(id) ON DELETE CASCADE,
  share_url TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_roast_me_ai_users_email ON roast_me_ai_users(email);
CREATE INDEX idx_roast_me_ai_users_username ON roast_me_ai_users(username);

-- Image uploads indexes
CREATE INDEX idx_roast_me_ai_uploads_user_id ON roast_me_ai_image_uploads(user_id);
CREATE INDEX idx_roast_me_ai_uploads_status ON roast_me_ai_image_uploads(status);
CREATE INDEX idx_roast_me_ai_uploads_created ON roast_me_ai_image_uploads(uploaded_at);

-- Features indexes
CREATE INDEX idx_roast_me_ai_features_image_id ON roast_me_ai_features(image_id);
CREATE INDEX idx_roast_me_ai_features_name ON roast_me_ai_features(feature_name);

-- Characters indexes
CREATE INDEX idx_roast_me_ai_characters_user_id ON roast_me_ai_characters(user_id);
CREATE INDEX idx_roast_me_ai_characters_image_id ON roast_me_ai_characters(image_id);
CREATE INDEX idx_roast_me_ai_characters_created ON roast_me_ai_characters(created_at);

-- Shares indexes
CREATE INDEX idx_roast_me_ai_shares_character_id ON roast_me_ai_shares(character_id);
CREATE INDEX idx_roast_me_ai_shares_url ON roast_me_ai_shares(share_url);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE roast_me_ai_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_me_ai_image_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_me_ai_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_me_ai_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_me_ai_shares ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES (Anonymous-friendly for now)
-- =====================================================

-- Users policies (for future use)
CREATE POLICY "Users can view their own profile" ON roast_me_ai_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON roast_me_ai_users
  FOR UPDATE USING (auth.uid() = id);

-- Image uploads policies (allow anonymous usage)
CREATE POLICY "Allow public image uploads" ON roast_me_ai_image_uploads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to view their uploads" ON roast_me_ai_image_uploads
  FOR SELECT USING (
    user_id = COALESCE(auth.uid()::text, user_id)
  );

CREATE POLICY "Allow users to update their uploads" ON roast_me_ai_image_uploads
  FOR UPDATE USING (
    user_id = COALESCE(auth.uid()::text, user_id)
  );

CREATE POLICY "Allow users to delete their uploads" ON roast_me_ai_image_uploads
  FOR DELETE USING (
    user_id = COALESCE(auth.uid()::text, user_id)
  );

-- Features policies (allow anonymous usage)
CREATE POLICY "Allow public feature creation" ON roast_me_ai_features
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow viewing features for owned images" ON roast_me_ai_features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roast_me_ai_image_uploads
      WHERE roast_me_ai_image_uploads.id = roast_me_ai_features.image_id
      AND roast_me_ai_image_uploads.user_id = COALESCE(auth.uid()::text, roast_me_ai_image_uploads.user_id)
    )
  );

-- Characters policies (allow anonymous usage)
CREATE POLICY "Allow public character creation" ON roast_me_ai_characters
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow viewing characters" ON roast_me_ai_characters
  FOR SELECT USING (
    user_id = COALESCE(auth.uid()::text, user_id) OR
    EXISTS (
      SELECT 1 FROM roast_me_ai_shares
      WHERE roast_me_ai_shares.character_id = roast_me_ai_characters.id
      AND (roast_me_ai_shares.expires_at IS NULL OR roast_me_ai_shares.expires_at > NOW())
    )
  );

CREATE POLICY "Allow users to update their characters" ON roast_me_ai_characters
  FOR UPDATE USING (
    user_id = COALESCE(auth.uid()::text, user_id)
  );

CREATE POLICY "Allow users to delete their characters" ON roast_me_ai_characters
  FOR DELETE USING (
    user_id = COALESCE(auth.uid()::text, user_id)
  );

-- Shares policies (allow anonymous usage)
CREATE POLICY "Allow public share creation" ON roast_me_ai_shares
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public share viewing" ON roast_me_ai_shares
  FOR SELECT USING (true);

CREATE POLICY "Allow character owners to manage shares" ON roast_me_ai_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM roast_me_ai_characters
      WHERE roast_me_ai_characters.id = roast_me_ai_shares.character_id
      AND roast_me_ai_characters.user_id = COALESCE(auth.uid()::text, roast_me_ai_characters.user_id)
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_roast_me_ai_users_updated_at
  BEFORE UPDATE ON roast_me_ai_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant permissions to anon and authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT ALL ON TABLE roast_me_ai_users TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_image_uploads TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_features TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_characters TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_shares TO anon, authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- STORAGE BUCKET (for file uploads)
-- =====================================================

-- Create storage bucket for roast-me-ai files
INSERT INTO storage.buckets (id, name, public)
VALUES ('roast-me-ai', 'roast-me-ai', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the bucket
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'roast-me-ai');

CREATE POLICY "Allow public downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'roast-me-ai');

CREATE POLICY "Allow users to delete their files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'roast-me-ai' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert a test user
INSERT INTO roast_me_ai_users (email, username) 
VALUES ('test@example.com', 'testuser')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables exist with correct prefixes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'roast_me_ai_%'
ORDER BY table_name;

-- Verify all indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%roast_me_ai_%'
ORDER BY indexname;

-- Verify all policies exist
SELECT policyname, tablename 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'roast_me_ai_%'
ORDER BY tablename, policyname;