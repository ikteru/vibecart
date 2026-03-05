-- Instagram Token Status Tracking
-- Adds status, health monitoring, and failure tracking to instagram_tokens

-- Add status tracking columns
ALTER TABLE instagram_tokens
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expiring', 'expired', 'revoked', 'refresh_failed')),
  ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refresh_failure_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Index for background job queries (find tokens by status and expiration)
CREATE INDEX IF NOT EXISTS idx_instagram_tokens_status
  ON instagram_tokens (status, expires_at);

-- Atomic connect: upserts token and updates seller config in one transaction
CREATE OR REPLACE FUNCTION connect_instagram(
  p_seller_id UUID,
  p_token_id UUID,
  p_instagram_user_id TEXT,
  p_instagram_username TEXT,
  p_access_token_encrypted TEXT,
  p_token_type TEXT,
  p_expires_at TIMESTAMPTZ,
  p_scopes TEXT[],
  p_instagram_config JSONB
) RETURNS void AS $$
BEGIN
  -- Upsert token
  INSERT INTO instagram_tokens (
    id, seller_id, instagram_user_id, instagram_username,
    access_token_encrypted, token_type, expires_at, scopes,
    status, refresh_failure_count
  ) VALUES (
    p_token_id, p_seller_id, p_instagram_user_id, p_instagram_username,
    p_access_token_encrypted, p_token_type, p_expires_at, p_scopes,
    'active', 0
  )
  ON CONFLICT (seller_id) DO UPDATE SET
    instagram_user_id = EXCLUDED.instagram_user_id,
    instagram_username = EXCLUDED.instagram_username,
    access_token_encrypted = EXCLUDED.access_token_encrypted,
    token_type = EXCLUDED.token_type,
    expires_at = EXCLUDED.expires_at,
    scopes = EXCLUDED.scopes,
    status = 'active',
    refresh_failure_count = 0,
    last_error = NULL,
    last_validated_at = NOW(),
    updated_at = NOW();

  -- Update seller config
  UPDATE sellers
  SET shop_config = jsonb_set(
    COALESCE(shop_config::jsonb, '{}'::jsonb),
    '{instagram}',
    p_instagram_config
  ),
  updated_at = NOW()
  WHERE id = p_seller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic disconnect: removes token and updates seller config in one transaction
CREATE OR REPLACE FUNCTION disconnect_instagram(p_seller_id UUID) RETURNS void AS $$
BEGIN
  -- Delete token
  DELETE FROM instagram_tokens WHERE seller_id = p_seller_id;

  -- Update seller config to disconnected
  UPDATE sellers
  SET shop_config = jsonb_set(
    COALESCE(shop_config::jsonb, '{}'::jsonb),
    '{instagram}',
    '{"isConnected": false}'::jsonb
  ),
  updated_at = NOW()
  WHERE id = p_seller_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
