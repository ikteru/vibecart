-- Customer Login Tokens
-- Magic link tokens for WhatsApp-based passwordless customer authentication.
-- Customers receive a login link via WhatsApp, clicking it verifies the token
-- and creates a session cookie.

CREATE TABLE customer_login_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,           -- Normalized: 212XXXXXXXXX
  token TEXT NOT NULL UNIQUE,    -- Secure random token
  redirect_url TEXT,             -- Where to send the customer after login
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup by token (used on every verify request)
CREATE INDEX idx_customer_login_tokens_token ON customer_login_tokens(token);

-- Cleanup: auto-delete expired tokens older than 1 hour
-- (tokens expire in 10 minutes, but we keep them briefly for audit)
CREATE INDEX idx_customer_login_tokens_expires ON customer_login_tokens(expires_at);

-- Rate limiting: check recent tokens for a phone number
CREATE INDEX idx_customer_login_tokens_phone_created ON customer_login_tokens(phone, created_at DESC);

-- RLS: This table is only accessed via admin client (service role)
-- No RLS policies needed — all access goes through server-side API routes
ALTER TABLE customer_login_tokens ENABLE ROW LEVEL SECURITY;
