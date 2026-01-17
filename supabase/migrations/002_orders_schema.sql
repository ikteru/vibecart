-- ============================================================
-- VibeCart Orders Schema Migration
-- ============================================================
-- Creates tables for order management:
-- - orders: Customer orders with status lifecycle
-- - order_items: Individual line items for each order
-- - order_messages: Buyer-seller chat messages
-- ============================================================

-- ============================================================
-- Orders Table
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- Shipping address fields
  address_city TEXT NOT NULL,
  address_neighborhood TEXT,
  address_street TEXT NOT NULL,
  address_building_name TEXT,
  address_floor TEXT,
  address_apartment_number TEXT,
  address_delivery_instructions TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_url TEXT,

  -- Order status and totals (amounts in centimes)
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal INTEGER NOT NULL,
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MAD',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_order_status CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  CONSTRAINT subtotal_non_negative CHECK (subtotal >= 0),
  CONSTRAINT shipping_cost_non_negative CHECK (shipping_cost >= 0),
  CONSTRAINT total_non_negative CHECK (total >= 0)
);

-- ============================================================
-- Order Items Table (Normalized)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Keep item even if product deleted
  title TEXT NOT NULL, -- Snapshot of product title at time of order
  price_amount INTEGER NOT NULL, -- Unit price in centimes
  price_currency TEXT NOT NULL DEFAULT 'MAD',
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_variant TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT quantity_positive CHECK (quantity > 0),
  CONSTRAINT price_positive CHECK (price_amount > 0)
);

-- ============================================================
-- Order Messages Table (Chat)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'buyer', 'seller', or 'system'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_sender CHECK (sender IN ('buyer', 'seller', 'system'))
);

-- ============================================================
-- WhatsApp Commands Log
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  buyer_phone TEXT NOT NULL,
  raw_message TEXT NOT NULL,
  parsed_command TEXT,
  command_args JSONB DEFAULT '{}',
  execution_result JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Order Messages
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created_at ON order_messages(order_id, created_at);

-- WhatsApp Commands
CREATE INDEX IF NOT EXISTS idx_whatsapp_commands_seller ON whatsapp_commands(seller_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_commands_buyer ON whatsapp_commands(buyer_phone);

-- ============================================================
-- Triggers
-- ============================================================

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_commands ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Orders Policies
-- ============================================================

-- Sellers can view their own orders
CREATE POLICY "Sellers read own orders"
  ON orders
  FOR SELECT
  USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- Anyone can create orders (public checkout)
CREATE POLICY "Public create orders"
  ON orders
  FOR INSERT
  WITH CHECK (true);

-- Sellers can update their own orders (status changes)
CREATE POLICY "Sellers update own orders"
  ON orders
  FOR UPDATE
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
-- Order Items Policies
-- ============================================================

-- Sellers can view items for their orders
CREATE POLICY "Sellers read own order items"
  ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- Anyone can create order items (during checkout)
CREATE POLICY "Public create order items"
  ON order_items
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Order Messages Policies
-- ============================================================

-- Sellers can view messages for their orders
CREATE POLICY "Sellers read own order messages"
  ON order_messages
  FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- Anyone can add messages (buyer messages via phone verification would be separate)
CREATE POLICY "Public create order messages"
  ON order_messages
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- WhatsApp Commands Policies
-- ============================================================

-- Sellers can view their command logs
CREATE POLICY "Sellers read own commands"
  ON whatsapp_commands
  FOR SELECT
  USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- Anyone can create commands (webhook)
CREATE POLICY "Public create whatsapp commands"
  ON whatsapp_commands
  FOR INSERT
  WITH CHECK (true);

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

-- Function to generate next order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get count of orders today + 1
  SELECT COUNT(*) + 1 INTO counter
  FROM orders
  WHERE created_at >= CURRENT_DATE;

  -- Format: ORD-YYYYMMDD-XXXX
  new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');

  RETURN new_number;
END;
$$;
