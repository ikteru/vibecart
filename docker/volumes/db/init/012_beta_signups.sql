-- Beta Signups Table
-- Stores pre-launch beta waitlist registrations

CREATE TABLE IF NOT EXISTS beta_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_handle TEXT NOT NULL UNIQUE,
  whatsapp_number TEXT NOT NULL,
  city TEXT,
  category TEXT,
  queue_position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public inserts (no auth required for beta signup)
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on beta_signups"
  ON beta_signups
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for duplicate checking
CREATE INDEX IF NOT EXISTS idx_beta_signups_instagram_handle
  ON beta_signups(instagram_handle);

-- Index for counting (queue position)
CREATE INDEX IF NOT EXISTS idx_beta_signups_queue_position
  ON beta_signups(queue_position);
