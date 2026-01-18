-- ============================================================
-- Schema Fixes Migration
-- ============================================================
-- This script fixes the outdated Docker init schema to match
-- the proper Supabase migrations. It's idempotent (safe to run multiple times).
-- ============================================================

-- ============================================================
-- Fix Orders Table - Add Missing Columns
-- ============================================================
DO $$
BEGIN
  -- Add address_building_name if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'orders' AND column_name = 'address_building_name') THEN
    ALTER TABLE orders ADD COLUMN address_building_name TEXT;
  END IF;

  -- Add address_floor if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'orders' AND column_name = 'address_floor') THEN
    ALTER TABLE orders ADD COLUMN address_floor TEXT;
  END IF;

  -- Add address_apartment_number if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'orders' AND column_name = 'address_apartment_number') THEN
    ALTER TABLE orders ADD COLUMN address_apartment_number TEXT;
  END IF;

  -- Add address_delivery_instructions if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'orders' AND column_name = 'address_delivery_instructions') THEN
    ALTER TABLE orders ADD COLUMN address_delivery_instructions TEXT;
  END IF;
END $$;

-- ============================================================
-- Order Items Table
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price_amount INTEGER NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'MAD',
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_variant TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT quantity_positive CHECK (quantity > 0),
  CONSTRAINT price_positive CHECK (price_amount > 0)
);

-- ============================================================
-- Order Messages Table
-- ============================================================
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_sender CHECK (sender IN ('buyer', 'seller', 'system'))
);

-- ============================================================
-- Activity Tracking Table
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  changes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Instagram Tokens Table
-- ============================================================
CREATE TABLE IF NOT EXISTS instagram_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID UNIQUE NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'long_lived',
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WhatsApp Business Tokens Table
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_business_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID UNIQUE NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  display_phone_number TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WhatsApp Message Templates Table
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_language TEXT NOT NULL DEFAULT 'ar',
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  components JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, template_name, template_language)
);

-- ============================================================
-- WhatsApp Messages Table
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  whatsapp_message_id TEXT,
  recipient_phone TEXT NOT NULL,
  template_name TEXT,
  message_type TEXT NOT NULL,
  message_content JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING',
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

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Order Messages
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created_at ON order_messages(order_id, created_at);

-- Activity Tracking
CREATE INDEX IF NOT EXISTS idx_activity_tracking_seller ON activity_tracking(seller_id);
CREATE INDEX IF NOT EXISTS idx_activity_tracking_entity ON activity_tracking(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_tracking_created ON activity_tracking(created_at DESC);

-- Instagram Tokens
CREATE INDEX IF NOT EXISTS idx_instagram_tokens_seller ON instagram_tokens(seller_id);

-- WhatsApp Business Tokens
CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_seller ON whatsapp_business_tokens(seller_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_tokens_phone_number_id ON whatsapp_business_tokens(phone_number_id);

-- WhatsApp Message Templates
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_seller ON whatsapp_message_templates(seller_id);

-- WhatsApp Messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_seller ON whatsapp_messages(seller_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_order ON whatsapp_messages(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_whatsapp_id ON whatsapp_messages(whatsapp_message_id) WHERE whatsapp_message_id IS NOT NULL;

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_business_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Service Role Policies (full access for backend)
-- ============================================================

-- Order Items
DO $$ BEGIN
  CREATE POLICY "Service role full access order_items"
    ON order_items FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order Messages
DO $$ BEGIN
  CREATE POLICY "Service role full access order_messages"
    ON order_messages FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Activity Tracking
DO $$ BEGIN
  CREATE POLICY "Service role full access activity_tracking"
    ON activity_tracking FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Instagram Tokens
DO $$ BEGIN
  CREATE POLICY "Service role full access instagram_tokens"
    ON instagram_tokens FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- WhatsApp Business Tokens
DO $$ BEGIN
  CREATE POLICY "Service role full access whatsapp_business_tokens"
    ON whatsapp_business_tokens FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- WhatsApp Message Templates
DO $$ BEGIN
  CREATE POLICY "Service role full access whatsapp_message_templates"
    ON whatsapp_message_templates FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- WhatsApp Messages
DO $$ BEGIN
  CREATE POLICY "Service role full access whatsapp_messages"
    ON whatsapp_messages FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Public Insert Policies (for checkout and webhooks)
-- ============================================================

-- Anyone can create orders (public checkout)
DO $$ BEGIN
  CREATE POLICY "Public create orders"
    ON orders FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Anyone can create order items (during checkout)
DO $$ BEGIN
  CREATE POLICY "Public create order_items"
    ON order_items FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Anyone can create order messages
DO $$ BEGIN
  CREATE POLICY "Public create order_messages"
    ON order_messages FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Authenticated User Policies
-- ============================================================

-- Sellers can view their own orders
DO $$ BEGIN
  CREATE POLICY "Sellers read own orders"
    ON orders FOR SELECT
    USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sellers can update their own orders
DO $$ BEGIN
  CREATE POLICY "Sellers update own orders"
    ON orders FOR UPDATE
    USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))
    WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sellers can view items for their orders
DO $$ BEGIN
  CREATE POLICY "Sellers read own order_items"
    ON order_items FOR SELECT
    USING (order_id IN (
      SELECT o.id FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      WHERE s.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sellers can view messages for their orders
DO $$ BEGIN
  CREATE POLICY "Sellers read own order_messages"
    ON order_messages FOR SELECT
    USING (order_id IN (
      SELECT o.id FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      WHERE s.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Sellers can update messages (mark as read)
DO $$ BEGIN
  CREATE POLICY "Sellers update own order_messages"
    ON order_messages FOR UPDATE
    USING (order_id IN (
      SELECT o.id FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      WHERE s.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to get order statistics for a seller
CREATE OR REPLACE FUNCTION get_seller_order_stats(p_seller_id UUID)
RETURNS TABLE (
  total_orders BIGINT,
  pending_orders BIGINT,
  total_revenue BIGINT,
  orders_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_orders,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_orders,
    COALESCE(SUM(total) FILTER (WHERE status IN ('confirmed', 'shipped', 'delivered')), 0)::BIGINT as total_revenue,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as orders_today
  FROM orders
  WHERE seller_id = p_seller_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_seller_order_stats TO anon, authenticated, service_role;

-- ============================================================
-- Done!
-- ============================================================
SELECT 'Schema fixes applied successfully!' as status;
