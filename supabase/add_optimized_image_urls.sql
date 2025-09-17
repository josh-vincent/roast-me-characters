-- Add medium_url field for optimized image storage
-- This migration adds support for multiple image sizes to improve performance

-- Add medium_url column to store 400x400 optimized images
ALTER TABLE roast_me_ai_characters 
ADD COLUMN IF NOT EXISTS medium_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN roast_me_ai_characters.model_url IS 'Original generated character image URL (full size)';
COMMENT ON COLUMN roast_me_ai_characters.thumbnail_url IS 'Thumbnail image URL (150x150 optimized for gallery cards)';
COMMENT ON COLUMN roast_me_ai_characters.medium_url IS 'Medium image URL (400x400 optimized for detail views)';

-- Create index for better query performance on image URLs
CREATE INDEX IF NOT EXISTS idx_characters_image_urls ON roast_me_ai_characters(model_url, thumbnail_url, medium_url) WHERE model_url IS NOT NULL;

-- Update RLS policies to include new column (if RLS is enabled)
-- Note: Existing RLS policies should automatically cover the new column