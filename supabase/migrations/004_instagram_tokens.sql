-- ============================================================
-- Instagram OAuth Tokens Migration
-- ============================================================
-- Stores encrypted Instagram access tokens for sellers
-- Separate table for security isolation and strict RLS policies
-- ============================================================

-- ============================================================
-- Instagram Tokens Table
-- ============================================================
CREATE TABLE IF NOT EXISTS instagram_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID UNIQUE NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,  -- Encrypted with app secret
  token_type TEXT NOT NULL DEFAULT 'bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

-- Primary lookup by seller
CREATE INDEX IF NOT EXISTS idx_instagram_tokens_seller
  ON instagram_tokens(seller_id);

-- Find tokens by expiration date (for refresh queries)
CREATE INDEX IF NOT EXISTS idx_instagram_tokens_expiring
  ON instagram_tokens(expires_at);

-- ============================================================
-- Updated At Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_instagram_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_instagram_tokens_updated_at
  BEFORE UPDATE ON instagram_tokens
  FOR EACH ROW EXECUTE FUNCTION update_instagram_tokens_updated_at();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE instagram_tokens ENABLE ROW LEVEL SECURITY;

-- Sellers can only access their own tokens
CREATE POLICY "Sellers access own instagram tokens"
  ON instagram_tokens
  FOR ALL
  USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to check if a seller has a valid (non-expired) Instagram token
CREATE OR REPLACE FUNCTION has_valid_instagram_token(p_seller_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  token_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM instagram_tokens
    WHERE seller_id = p_seller_id
      AND expires_at > NOW()
  ) INTO token_exists;

  RETURN token_exists;
END;
$$;

-- Function to get tokens expiring within N days (for refresh job)
CREATE OR REPLACE FUNCTION get_expiring_instagram_tokens(days_until_expiry INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  seller_id UUID,
  instagram_user_id TEXT,
  instagram_username TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with elevated privileges for admin operations
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.seller_id,
    t.instagram_user_id,
    t.instagram_username,
    t.expires_at
  FROM instagram_tokens t
  WHERE t.expires_at < NOW() + (days_until_expiry || ' days')::INTERVAL
    AND t.expires_at > NOW()  -- Still valid, just expiring soon
  ORDER BY t.expires_at ASC;
END;
$$;
