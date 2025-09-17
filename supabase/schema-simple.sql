-- Roast Me AI - Simple Database Schema
-- Copy and paste this into Supabase SQL Editor

-- Create tables with roast_me_ai prefix
CREATE TABLE IF NOT EXISTS roast_me_ai_image_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS roast_me_ai_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID REFERENCES roast_me_ai_image_uploads(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  feature_value TEXT NOT NULL,
  confidence DECIMAL(3,2),
  exaggeration_factor DECIMAL(3,1)
);

CREATE TABLE IF NOT EXISTS roast_me_ai_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID REFERENCES roast_me_ai_image_uploads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  model_url TEXT,
  thumbnail_url TEXT,
  generation_params JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_uploads_user ON roast_me_ai_image_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_features_image ON roast_me_ai_features(image_id);
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_characters_user ON roast_me_ai_characters(user_id);

-- Enable Row Level Security
ALTER TABLE roast_me_ai_image_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_me_ai_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_me_ai_characters ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all operations (for testing)
-- You can make these more restrictive later
CREATE POLICY "Allow all operations" ON roast_me_ai_image_uploads FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON roast_me_ai_features FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON roast_me_ai_characters FOR ALL USING (true);