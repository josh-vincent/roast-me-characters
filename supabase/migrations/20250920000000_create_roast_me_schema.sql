-- Corrected Roast Me AI Database Schema
-- This schema matches the exact columns our app expects

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS roast_me_ai_shares CASCADE;
DROP TABLE IF EXISTS roast_me_ai_characters CASCADE;
DROP TABLE IF EXISTS roast_me_ai_features CASCADE;
DROP TABLE IF EXISTS roast_me_ai_image_uploads CASCADE;
DROP TABLE IF EXISTS roast_me_ai_users CASCADE;

-- =====================================================
-- TABLE DEFINITIONS
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
  user_id TEXT NOT NULL,
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

-- Main characters table with all required columns
CREATE TABLE roast_me_ai_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL,
  user_id TEXT,
  model_url TEXT,
  thumbnail_url TEXT,
  generation_params JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  
  -- Additional columns our app expects
  seo_slug TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  ai_features_json JSONB DEFAULT '[]',
  medium_url TEXT,
  share_token TEXT
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
CREATE INDEX idx_roast_me_ai_characters_seo_slug ON roast_me_ai_characters(seo_slug);
CREATE INDEX idx_roast_me_ai_characters_is_public ON roast_me_ai_characters(is_public);

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
-- RLS POLICIES (Allow all for development)
-- =====================================================

-- Simple policies for development - allow all operations
CREATE POLICY "Allow all on users" ON roast_me_ai_users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on uploads" ON roast_me_ai_image_uploads
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on features" ON roast_me_ai_features
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on characters" ON roast_me_ai_characters
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on shares" ON roast_me_ai_shares
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated and anonymous users
GRANT ALL ON TABLE roast_me_ai_users TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_image_uploads TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_features TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_characters TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_shares TO anon, authenticated;