-- Simplified JSON-based features storage migration
-- This replaces the complex normalized features table with JSON metadata

-- =====================================================
-- 1. ADD JSON FEATURES COLUMN TO CHARACTERS TABLE
-- =====================================================

-- Add ai_features_json column to store all AI analysis data as JSON
ALTER TABLE roast_me_ai_characters ADD COLUMN IF NOT EXISTS 
  ai_features_json JSONB;

-- Add index for JSON queries
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_characters_features_json 
ON roast_me_ai_characters USING GIN (ai_features_json);

-- =====================================================
-- 2. MIGRATE EXISTING DATA (if any exists)
-- =====================================================

-- Migrate existing normalized features to JSON format
UPDATE roast_me_ai_characters 
SET ai_features_json = (
  SELECT jsonb_build_object(
    'features', jsonb_agg(
      jsonb_build_object(
        'feature_name', f.feature_name,
        'feature_value', f.feature_value,
        'confidence', f.confidence,
        'exaggeration_factor', f.exaggeration_factor
      )
    ),
    'migrated_at', NOW()
  )
  FROM roast_me_ai_features f
  WHERE f.image_id = roast_me_ai_characters.image_id
)
WHERE EXISTS (
  SELECT 1 FROM roast_me_ai_features f 
  WHERE f.image_id = roast_me_ai_characters.image_id
);

-- =====================================================
-- 3. DROP THE COMPLEX NORMALIZED TABLE (optional - can be done later)
-- =====================================================

-- Comment out for now - can be uncommented after confirming migration works
-- DROP TABLE IF EXISTS roast_me_ai_features CASCADE;

-- =====================================================
-- 4. ADD HELPER FUNCTIONS FOR JSON QUERIES
-- =====================================================

-- Function to extract features from JSON
CREATE OR REPLACE FUNCTION get_character_features(character_id UUID)
RETURNS TABLE(
  feature_name TEXT,
  feature_value TEXT,
  confidence NUMERIC,
  exaggeration_factor INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (feature->>'feature_name')::TEXT,
    (feature->>'feature_value')::TEXT,
    (feature->>'confidence')::NUMERIC,
    (feature->>'exaggeration_factor')::INTEGER
  FROM roast_me_ai_characters,
       jsonb_array_elements(ai_features_json->'features') AS feature
  WHERE id = character_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search characters by feature name
CREATE OR REPLACE FUNCTION search_characters_by_feature(search_term TEXT)
RETURNS TABLE(
  character_id UUID,
  feature_name TEXT,
  confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    (feature->>'feature_name')::TEXT,
    (feature->>'confidence')::NUMERIC
  FROM roast_me_ai_characters c,
       jsonb_array_elements(c.ai_features_json->'features') AS feature
  WHERE feature->>'feature_name' ILIKE '%' || search_term || '%'
  ORDER BY (feature->>'confidence')::NUMERIC DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. UPDATE COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN roast_me_ai_characters.ai_features_json IS 
'JSON storage for AI-analyzed features, including confidence scores (1-10) and exaggeration factors (1-9)';

-- =====================================================
-- 6. SAMPLE JSON STRUCTURE
-- =====================================================

/*
Expected JSON structure in ai_features_json column:

{
  "features": [
    {
      "feature_name": "Eyes",
      "feature_value": "Large expressive eyes with long lashes",
      "confidence": 8.5,
      "exaggeration_factor": 6
    },
    {
      "feature_name": "Nose",
      "feature_value": "Small button nose",
      "confidence": 7.2,
      "exaggeration_factor": 3
    }
  ],
  "character_style": "cartoon",
  "dominant_color": "blue",
  "personality_traits": ["friendly", "energetic", "creative"],
  "analysis_timestamp": "2024-01-15T10:30:00Z",
  "ai_model": "gemini-1.5-pro"
}
*/

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Check the new column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roast_me_ai_characters' 
  AND column_name = 'ai_features_json';

-- Sample query to test JSON functionality
-- SELECT id, ai_features_json->'features' as features 
-- FROM roast_me_ai_characters 
-- WHERE ai_features_json IS NOT NULL
-- LIMIT 5;

COMMIT;