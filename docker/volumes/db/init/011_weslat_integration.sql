-- Weslat WhatsApp Broker Integration
-- Adds support for routing messages through Weslat broker service
-- instead of calling Meta Cloud API directly per seller.

-- 1. Add Weslat tracking columns to whatsapp_messages
ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS weslat_message_id UUID,
  ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT 'direct'
    CHECK (channel_type IN ('direct', 'platform', 'seller'));

COMMENT ON COLUMN whatsapp_messages.weslat_message_id IS 'Weslat broker message ID for tracking';
COMMENT ON COLUMN whatsapp_messages.channel_type IS 'direct=Meta API, platform=VibeCart shared number, seller=seller own number';

-- 2. Seller Weslat channel mapping
-- Maps sellers who connected their own WhatsApp number to their Weslat channel
CREATE TABLE IF NOT EXISTS seller_weslat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  weslat_channel_id UUID NOT NULL,
  weslat_api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id)
);

-- RLS for seller_weslat_channels
ALTER TABLE seller_weslat_channels ENABLE ROW LEVEL SECURITY;

-- Sellers can read their own channel mapping
CREATE POLICY "Sellers can view their own Weslat channel"
  ON seller_weslat_channels
  FOR SELECT
  USING (seller_id IN (
    SELECT id FROM sellers WHERE user_id = auth.uid()
  ));

-- Service role has full access (for server actions)
CREATE POLICY "Service role full access on seller_weslat_channels"
  ON seller_weslat_channels
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookup by seller
CREATE INDEX IF NOT EXISTS idx_seller_weslat_channels_seller_id
  ON seller_weslat_channels(seller_id)
  WHERE is_active = true;

-- Index for Weslat message ID lookup (for status callbacks)
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_weslat_message_id
  ON whatsapp_messages(weslat_message_id)
  WHERE weslat_message_id IS NOT NULL;
