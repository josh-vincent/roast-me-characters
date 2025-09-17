-- Create waitlist table for mobile app coming soon signups
CREATE TABLE roast_me_ai_waitlist (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'social')),
  is_notified BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create indexes for performance
CREATE INDEX idx_roast_me_ai_waitlist_email ON roast_me_ai_waitlist(email);
CREATE INDEX idx_roast_me_ai_waitlist_created_at ON roast_me_ai_waitlist(created_at);
CREATE INDEX idx_roast_me_ai_waitlist_is_notified ON roast_me_ai_waitlist(is_notified);

-- Enable RLS (Row Level Security)
ALTER TABLE roast_me_ai_waitlist ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Public can insert (for signups)
CREATE POLICY "Anyone can signup for waitlist" ON roast_me_ai_waitlist
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users/admins can view (for admin dashboard)
CREATE POLICY "Only admins can view waitlist" ON roast_me_ai_waitlist
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_roast_me_ai_waitlist_updated_at
  BEFORE UPDATE ON roast_me_ai_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();