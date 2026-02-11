-- ============================================================
-- Delivery Management Schema
-- Phase 1: Manual dispatch via WhatsApp
-- ============================================================

-- ============================================================
-- Delivery Persons Table
-- Stores seller's saved delivery personnel for quick dispatch
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  dispatch_count INTEGER DEFAULT 0,
  last_dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT delivery_person_phone_format CHECK (phone ~ '^(0|\+212|212)[567]\d{8}$')
);

-- ============================================================
-- Order Dispatches Table
-- Tracks dispatch history for orders
-- ============================================================
CREATE TABLE IF NOT EXISTS order_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  dispatch_type VARCHAR(20) NOT NULL DEFAULT 'manual',  -- 'manual', 'glovo', 'amana', etc.

  -- Manual dispatch fields
  delivery_person_id UUID REFERENCES delivery_persons(id) ON DELETE SET NULL,
  delivery_person_name VARCHAR(100),  -- Denormalized for history
  delivery_person_phone VARCHAR(15),  -- Denormalized for history

  -- API provider fields (Phase 2+)
  provider_id UUID,
  external_tracking_id VARCHAR(100),
  external_status VARCHAR(50),

  -- Pricing
  cod_amount INTEGER,  -- Cash on delivery in centimes

  -- Status tracking
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  status_history JSONB DEFAULT '[]',
  whatsapp_sent_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_dispatch_type CHECK (dispatch_type IN ('manual', 'glovo', 'amana', 'maystro')),
  CONSTRAINT valid_dispatch_status CHECK (status IN ('pending', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned'))
);

-- ============================================================
-- Indexes
-- ============================================================

-- Delivery Persons
CREATE INDEX IF NOT EXISTS idx_delivery_persons_seller_id ON delivery_persons(seller_id);
CREATE INDEX IF NOT EXISTS idx_delivery_persons_is_active ON delivery_persons(is_active);

-- Order Dispatches
CREATE INDEX IF NOT EXISTS idx_order_dispatches_order_id ON order_dispatches(order_id);
CREATE INDEX IF NOT EXISTS idx_order_dispatches_seller_id ON order_dispatches(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_dispatches_delivery_person_id ON order_dispatches(delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_order_dispatches_status ON order_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_order_dispatches_created_at ON order_dispatches(created_at DESC);

-- ============================================================
-- Updated At Triggers
-- ============================================================

CREATE TRIGGER update_delivery_persons_updated_at
  BEFORE UPDATE ON delivery_persons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_dispatches_updated_at
  BEFORE UPDATE ON order_dispatches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE delivery_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_dispatches ENABLE ROW LEVEL SECURITY;

-- Delivery Persons Policies
CREATE POLICY "Service role full access delivery_persons"
  ON delivery_persons
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Sellers can read own delivery_persons"
  ON delivery_persons
  FOR SELECT
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- Order Dispatches Policies
CREATE POLICY "Service role full access order_dispatches"
  ON order_dispatches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Sellers can read own order_dispatches"
  ON order_dispatches
  FOR SELECT
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Function to increment dispatch count
-- ============================================================
CREATE OR REPLACE FUNCTION increment_dispatch_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.delivery_person_id IS NOT NULL THEN
    UPDATE delivery_persons
    SET
      dispatch_count = dispatch_count + 1,
      last_dispatched_at = NOW()
    WHERE id = NEW.delivery_person_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_dispatch_count
  AFTER INSERT ON order_dispatches
  FOR EACH ROW EXECUTE FUNCTION increment_dispatch_count();
