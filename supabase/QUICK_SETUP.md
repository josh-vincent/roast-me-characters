# Quick Database Setup for Supabase

## Option 1: Run All Tables at Once (Recommended)

Copy and paste this SQL in your Supabase SQL Editor:

```sql
-- Create the image_uploads table
CREATE TABLE IF NOT EXISTS image_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create the ai_features table
CREATE TABLE IF NOT EXISTS ai_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES image_uploads(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  feature_value TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  exaggeration_factor DECIMAL(3,1) CHECK (exaggeration_factor >= 1 AND exaggeration_factor <= 10)
);

-- Create the characters_3d table
CREATE TABLE IF NOT EXISTS characters_3d (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES image_uploads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  model_url TEXT,
  thumbnail_url TEXT,
  generation_params JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_image_uploads_user_id ON image_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_features_image_id ON ai_features(image_id);
CREATE INDEX IF NOT EXISTS idx_characters_3d_user_id ON characters_3d(user_id);

-- Enable Row Level Security
ALTER TABLE image_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters_3d ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations (for testing)
CREATE POLICY "Allow all for testing" ON image_uploads FOR ALL USING (true);
CREATE POLICY "Allow all for testing" ON ai_features FOR ALL USING (true);
CREATE POLICY "Allow all for testing" ON characters_3d FOR ALL USING (true);
```

## Option 2: Use Without Database

The app now works without the database! Just use the `/simple` page and it will:
- Process images directly without storing them
- Use AI to analyze features
- Return results immediately

## How to Run the SQL:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste the SQL above
6. Click "Run"

## Verify Setup:

After running the SQL, you should see:
- 3 new tables: `image_uploads`, `ai_features`, `characters_3d`
- Success message: "Success. No rows returned"

## Storage Bucket:

You've already created the `roast-me-ai` bucket ✅

## Current Status:

- ✅ Storage bucket created
- ⚠️ Database tables need to be created (use SQL above)
- ✅ App works without database on `/simple` page