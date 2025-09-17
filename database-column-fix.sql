-- Fix the confidence column data type to match the constraint
-- This resolves the mismatch between DECIMAL(3,2) and 1-10 range

-- First, drop the existing constraint
ALTER TABLE roast_me_ai_features 
DROP CONSTRAINT IF EXISTS roast_me_ai_features_confidence_check;

-- Change the column type to accommodate 1-10 range
-- DECIMAL(4,2) allows values from 00.00 to 99.99
ALTER TABLE roast_me_ai_features 
ALTER COLUMN confidence TYPE DECIMAL(4,2);

-- Re-add the constraint for 1-10 range
ALTER TABLE roast_me_ai_features 
ADD CONSTRAINT roast_me_ai_features_confidence_check 
CHECK (confidence >= 1.00 AND confidence <= 10.00);

-- Update the column comment
COMMENT ON COLUMN roast_me_ai_features.confidence IS 'AI confidence score from 1.00-10.00';

-- Verify the change
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns 
WHERE table_name = 'roast_me_ai_features' 
  AND column_name = 'confidence';