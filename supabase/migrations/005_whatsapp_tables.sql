-- ============================================================
-- WhatsApp Business API Tables Migration
-- ============================================================
-- Stores encrypted WhatsApp Business tokens and message history
-- Follows the same security patterns as Instagram tokens
-- ============================================================

-- ============================================================
-- WhatsApp Business Tokens Table
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_business_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID UNIQUE NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,           -- WhatsApp Business Phone Number ID
  display_phone_number TEXT NOT NULL,      -- Human-readable phone number (e.g., +212612345678)
  business_account_id TEXT NOT NULL,       -- WhatsApp Business Account ID
  access_token_encrypted TEXT NOT NULL,    -- AES-256-GCM encrypted access token
  token_expires_at TIMESTAMPTZ,            -- Token expiration (60-day tokens for long-lived)
  is_active BOOLEAN NOT NULL DEFAULT true,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WhatsApp Message Templates Table
-- ============================================================
-- Stores Meta-approved message templates for this seller
CREATE TABLE IF NOT EXISTS whatsapp_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,             -- Meta template name (e.g., order_confirmation)
  template_language TEXT NOT NULL DEFAULT 'ar',
  category TEXT NOT NULL,                  -- UTILITY, MARKETING, AUTHENTICATION
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
  components JSONB NOT NULL DEFAULT '[]',  -- Template structure
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, template_name, template_language)
);

-- ============================================================
-- WhatsApp Messages Table
-- ============================================================
-- Logs all outbound messages for tracking and debugging
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  whatsapp_message_id TEXT,                -- Meta's message ID (wamid.xxx)
  recipient_phone TEXT NOT NULL,
  template_name TEXT,
  message_type TEXT NOT NULL,              -- template, text, interactive
  message_content JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, SENT, DELIVERED, READ, FAILED
  error_code TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

-- WhatsApp Business Tokens
CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_seller
  ON whatsapp_business_tokens(seller_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_expiring
  ON whatsapp_business_tokens(token_expires_at)
  WHERE token_expires_at IS NOT NULL;

-- WhatsApp Message Templates
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_seller
  ON whatsapp_message_templates(seller_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status
  ON whatsapp_message_templates(status);

-- WhatsApp Messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_seller
  ON whatsapp_messages(seller_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_order
  ON whatsapp_messages(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status
  ON whatsapp_messages(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_whatsapp_id
  ON whatsapp_messages(whatsapp_message_id)
  WHERE whatsapp_message_id IS NOT NULL;

-- ============================================================
-- Updated At Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION update_whatsapp_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_whatsapp_tokens_updated_at
  BEFORE UPDATE ON whatsapp_business_tokens
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_tokens_updated_at();

CREATE TRIGGER trigger_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_message_templates
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_tokens_updated_at();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE whatsapp_business_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- WhatsApp Business Tokens: Sellers can only access their own
CREATE POLICY "Sellers access own whatsapp tokens"
  ON whatsapp_business_tokens
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

-- WhatsApp Message Templates: Sellers can only access their own
CREATE POLICY "Sellers access own whatsapp templates"
  ON whatsapp_message_templates
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

-- WhatsApp Messages: Sellers can only access their own
CREATE POLICY "Sellers access own whatsapp messages"
  ON whatsapp_messages
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

-- Check if a seller has an active WhatsApp connection
CREATE OR REPLACE FUNCTION has_active_whatsapp_connection(p_seller_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  connection_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM whatsapp_business_tokens
    WHERE seller_id = p_seller_id
      AND is_active = true
      AND (token_expires_at IS NULL OR token_expires_at > NOW())
  ) INTO connection_exists;

  RETURN connection_exists;
END;
$$;

-- Get message delivery stats for a seller
CREATE OR REPLACE FUNCTION get_whatsapp_message_stats(
  p_seller_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_read BIGINT,
  total_failed BIGINT,
  delivery_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status IN ('SENT', 'DELIVERED', 'READ')) AS total_sent,
    COUNT(*) FILTER (WHERE status IN ('DELIVERED', 'READ')) AS total_delivered,
    COUNT(*) FILTER (WHERE status = 'READ') AS total_read,
    COUNT(*) FILTER (WHERE status = 'FAILED') AS total_failed,
    CASE
      WHEN COUNT(*) FILTER (WHERE status IN ('SENT', 'DELIVERED', 'READ')) > 0 THEN
        ROUND(
          (COUNT(*) FILTER (WHERE status IN ('DELIVERED', 'READ'))::NUMERIC /
           COUNT(*) FILTER (WHERE status IN ('SENT', 'DELIVERED', 'READ'))::NUMERIC) * 100,
          2
        )
      ELSE 0
    END AS delivery_rate
  FROM whatsapp_messages
  WHERE seller_id = p_seller_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION has_active_whatsapp_connection TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_whatsapp_message_stats TO authenticated, service_role;
