-- Fix confidence constraint and enhance schema for better image storage and sharing
-- Run this migration on your Supabase database

-- =====================================================
-- 1. FIX CONFIDENCE CONSTRAINT MISMATCH
-- =====================================================

-- Update the confidence column to accept 1-10 scale instead of 0-1
ALTER TABLE roast_me_ai_features 
DROP CONSTRAINT IF EXISTS roast_me_ai_features_confidence_check;

ALTER TABLE roast_me_ai_features 
ADD CONSTRAINT roast_me_ai_features_confidence_check 
CHECK (confidence >= 1 AND confidence <= 10);

-- Update the column comment for clarity
COMMENT ON COLUMN roast_me_ai_features.confidence IS 'AI confidence score from 1-10 (1=low, 10=high confidence)';

-- =====================================================
-- 2. ENHANCE IMAGE STORAGE FOR PROCESSED IMAGES
-- =====================================================

-- Add columns for optimized image storage and processing
ALTER TABLE roast_me_ai_image_uploads ADD COLUMN IF NOT EXISTS 
  processed_url TEXT;

ALTER TABLE roast_me_ai_image_uploads ADD COLUMN IF NOT EXISTS 
  thumbnail_url TEXT;

ALTER TABLE roast_me_ai_image_uploads ADD COLUMN IF NOT EXISTS 
  compressed_url TEXT;

ALTER TABLE roast_me_ai_image_uploads ADD COLUMN IF NOT EXISTS 
  processing_metadata JSONB DEFAULT '{}';

-- Add index for faster lookups by processing status
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_uploads_processed 
ON roast_me_ai_image_uploads(status, uploaded_at);

-- =====================================================
-- 3. ENHANCE CHARACTERS TABLE FOR SHARING
-- =====================================================

-- Add columns for better sharing and metadata
ALTER TABLE roast_me_ai_characters ADD COLUMN IF NOT EXISTS 
  share_token VARCHAR(32) UNIQUE;

ALTER TABLE roast_me_ai_characters ADD COLUMN IF NOT EXISTS 
  og_title TEXT;

ALTER TABLE roast_me_ai_characters ADD COLUMN IF NOT EXISTS 
  og_description TEXT;

ALTER TABLE roast_me_ai_characters ADD COLUMN IF NOT EXISTS 
  og_image_url TEXT;

ALTER TABLE roast_me_ai_characters ADD COLUMN IF NOT EXISTS 
  seo_slug VARCHAR(255);

ALTER TABLE roast_me_ai_characters ADD COLUMN IF NOT EXISTS 
  is_public BOOLEAN DEFAULT true;

ALTER TABLE roast_me_ai_characters ADD COLUMN IF NOT EXISTS 
  view_count INTEGER DEFAULT 0;

-- Add indexes for sharing and SEO
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_characters_share_token 
ON roast_me_ai_characters(share_token);

CREATE INDEX IF NOT EXISTS idx_roast_me_ai_characters_seo_slug 
ON roast_me_ai_characters(seo_slug);

CREATE INDEX IF NOT EXISTS idx_roast_me_ai_characters_public 
ON roast_me_ai_characters(is_public, created_at);

-- =====================================================
-- 4. ADD URL SHORTENING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS roast_me_ai_short_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(10) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  character_id UUID REFERENCES roast_me_ai_characters(id) ON DELETE CASCADE,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Index for fast short code lookups
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_short_urls_code 
ON roast_me_ai_short_urls(short_code);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_short_urls_character 
ON roast_me_ai_short_urls(character_id, created_at);

-- =====================================================
-- 5. ADD IMAGE PROCESSING QUEUE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS roast_me_ai_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES roast_me_ai_image_uploads(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL, -- 'thumbnail', 'compress', 'og-image', etc.
  priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_queue_status_priority 
ON roast_me_ai_processing_queue(status, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_roast_me_ai_queue_image_task 
ON roast_me_ai_processing_queue(image_id, task_type);

-- =====================================================
-- 6. ADD ANALYTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS roast_me_ai_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES roast_me_ai_characters(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'view', 'share', 'download', 'like'
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_analytics_character_event 
ON roast_me_ai_analytics(character_id, event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_roast_me_ai_analytics_event_date 
ON roast_me_ai_analytics(event_type, created_at);

-- =====================================================
-- 7. UPDATE RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE roast_me_ai_short_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_me_ai_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_me_ai_analytics ENABLE ROW LEVEL SECURITY;

-- Short URLs policies
CREATE POLICY "Allow public short URL creation" ON roast_me_ai_short_urls
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public short URL access" ON roast_me_ai_short_urls
  FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());

-- Processing queue policies (service-only access)
CREATE POLICY "Allow service processing queue access" ON roast_me_ai_processing_queue
  FOR ALL USING (true);

-- Analytics policies (allow tracking)
CREATE POLICY "Allow public analytics tracking" ON roast_me_ai_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow character owners to view analytics" ON roast_me_ai_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roast_me_ai_characters
      WHERE roast_me_ai_characters.id = roast_me_ai_analytics.character_id
      AND roast_me_ai_characters.user_id = COALESCE(auth.uid()::text, roast_me_ai_characters.user_id)
    )
  );

-- =====================================================
-- 8. ADD HELPER FUNCTIONS
-- =====================================================

-- Function to generate share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to generate short codes
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create SEO-friendly slugs
CREATE OR REPLACE FUNCTION generate_seo_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. ADD TRIGGERS FOR AUTO-GENERATION
-- =====================================================

-- Trigger to auto-generate share tokens
CREATE OR REPLACE FUNCTION auto_generate_share_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_token IS NULL THEN
    NEW.share_token := generate_share_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_share_token
  BEFORE INSERT ON roast_me_ai_characters
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_share_token();

-- Trigger to update view count
CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'view' THEN
    UPDATE roast_me_ai_characters 
    SET view_count = view_count + 1
    WHERE id = NEW.character_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_views
  AFTER INSERT ON roast_me_ai_analytics
  FOR EACH ROW
  EXECUTE FUNCTION increment_view_count();

-- =====================================================
-- 10. GRANT PERMISSIONS FOR NEW TABLES
-- =====================================================

GRANT ALL ON TABLE roast_me_ai_short_urls TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_processing_queue TO anon, authenticated;
GRANT ALL ON TABLE roast_me_ai_analytics TO anon, authenticated;

-- =====================================================
-- 11. VERIFICATION QUERIES
-- =====================================================

-- Check the updated confidence constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%confidence%';

-- List all new tables and columns
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name LIKE 'roast_me_ai_%' 
  AND (column_name LIKE '%url%' OR column_name LIKE '%token%' OR column_name LIKE '%slug%')
ORDER BY table_name, ordinal_position;

COMMIT;