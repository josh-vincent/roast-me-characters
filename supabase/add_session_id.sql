-- Add session_id column to track anonymous users
ALTER TABLE roast_me_ai_characters 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_characters_session_id 
ON roast_me_ai_characters(session_id) 
WHERE session_id IS NOT NULL;

-- Create index for user_id for efficient migration queries
CREATE INDEX IF NOT EXISTS idx_roast_me_ai_characters_user_id 
ON roast_me_ai_characters(user_id) 
WHERE user_id IS NOT NULL;

-- Update RLS policies to allow anonymous users to view their own characters
CREATE POLICY "Anonymous users can view their session characters" 
ON roast_me_ai_characters 
FOR SELECT 
USING (
  session_id IS NOT NULL 
  AND session_id = current_setting('app.session_id', true)
);

-- Allow anonymous users to create characters with session_id
CREATE POLICY "Anonymous users can create characters" 
ON roast_me_ai_characters 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL 
  AND session_id IS NOT NULL
);