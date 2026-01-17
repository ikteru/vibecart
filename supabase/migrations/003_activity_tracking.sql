-- ============================================================
-- VibeCart Activity Tracking Migration
-- ============================================================
-- Creates the activity_logs table for tracking seller actions:
-- - Product changes (created, updated, deleted, stock changes)
-- - Order status changes
-- - Settings updates
-- ============================================================

-- ============================================================
-- Activity Logs Table
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,  -- 'product', 'order', 'settings'
  entity_id UUID,              -- ID of the affected entity (optional for some actions)
  action TEXT NOT NULL,        -- 'created', 'updated', 'deleted', 'status_changed', 'stock_updated'
  changes JSONB DEFAULT '{}',  -- What changed (e.g., {field: {old: x, new: y}})
  metadata JSONB DEFAULT '{}', -- Additional context (e.g., {product_title: "..."})
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('product', 'order', 'settings', 'seller')),
  CONSTRAINT valid_action CHECK (action IN ('created', 'updated', 'deleted', 'status_changed', 'stock_updated', 'activated', 'deactivated'))
);

-- ============================================================
-- Indexes
-- ============================================================

-- Primary query pattern: get recent activity for a seller
CREATE INDEX IF NOT EXISTS idx_activity_logs_seller_created
  ON activity_logs(seller_id, created_at DESC);

-- Filter by entity type
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type
  ON activity_logs(seller_id, entity_type, created_at DESC);

-- Filter by specific entity
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id
  ON activity_logs(entity_id, created_at DESC)
  WHERE entity_id IS NOT NULL;

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own activity logs
CREATE POLICY "Sellers read own activity"
  ON activity_logs
  FOR SELECT
  USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- System can insert activity logs (via service role or authenticated)
CREATE POLICY "System create activity logs"
  ON activity_logs
  FOR INSERT
  WITH CHECK (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to get recent activity for a seller
CREATE OR REPLACE FUNCTION get_seller_activity(
  p_seller_id UUID,
  p_entity_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  seller_id UUID,
  entity_type TEXT,
  entity_id UUID,
  action TEXT,
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.seller_id,
    a.entity_type,
    a.entity_id,
    a.action,
    a.changes,
    a.metadata,
    a.created_at
  FROM activity_logs a
  WHERE
    a.seller_id = p_seller_id
    AND (p_entity_type IS NULL OR a.entity_type = p_entity_type)
  ORDER BY a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to log activity (convenience wrapper)
CREATE OR REPLACE FUNCTION log_activity(
  p_seller_id UUID,
  p_entity_type TEXT,
  p_action TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT '{}',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO activity_logs (seller_id, entity_type, entity_id, action, changes, metadata)
  VALUES (p_seller_id, p_entity_type, p_entity_id, p_action, p_changes, p_metadata)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ============================================================
-- Message Read Tracking (Add to order_messages)
-- ============================================================

-- Add read_at column to track when seller read the message
ALTER TABLE order_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Index for efficiently finding unread messages
CREATE INDEX IF NOT EXISTS idx_order_messages_unread
  ON order_messages(order_id, read_at)
  WHERE read_at IS NULL;

-- Function to get unread message count for an order
CREATE OR REPLACE FUNCTION get_unread_message_count(p_order_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count
  FROM order_messages
  WHERE order_id = p_order_id
    AND read_at IS NULL
    AND sender = 'buyer';  -- Only count buyer messages as unread

  RETURN count;
END;
$$;

-- Function to mark all messages in an order as read
CREATE OR REPLACE FUNCTION mark_messages_read(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE order_messages
  SET read_at = NOW()
  WHERE order_id = p_order_id
    AND read_at IS NULL
    AND sender = 'buyer';  -- Only mark buyer messages as read
END;
$$;

-- ============================================================
-- Order Search Enhancement
-- ============================================================

-- Full-text search index for orders
CREATE INDEX IF NOT EXISTS idx_orders_search
  ON orders USING gin(
    to_tsvector('simple', customer_name || ' ' || order_number || ' ' || customer_phone)
  );

-- Function to search seller orders
CREATE OR REPLACE FUNCTION search_seller_orders(
  p_seller_id UUID,
  p_search_query TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_to_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  seller_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  address_city TEXT,
  address_neighborhood TEXT,
  address_street TEXT,
  address_building_name TEXT,
  address_floor TEXT,
  address_apartment_number TEXT,
  address_delivery_instructions TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  location_url TEXT,
  status TEXT,
  subtotal INTEGER,
  shipping_cost INTEGER,
  total INTEGER,
  currency TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    o.seller_id,
    o.customer_name,
    o.customer_phone,
    o.address_city,
    o.address_neighborhood,
    o.address_street,
    o.address_building_name,
    o.address_floor,
    o.address_apartment_number,
    o.address_delivery_instructions,
    o.location_lat,
    o.location_lng,
    o.location_url,
    o.status,
    o.subtotal,
    o.shipping_cost,
    o.total,
    o.currency,
    o.created_at,
    o.updated_at,
    o.confirmed_at,
    o.shipped_at,
    o.delivered_at
  FROM orders o
  WHERE
    o.seller_id = p_seller_id
    AND (p_search_query IS NULL OR
         to_tsvector('simple', o.customer_name || ' ' || o.order_number || ' ' || o.customer_phone)
         @@ plainto_tsquery('simple', p_search_query))
    AND (p_status IS NULL OR o.status = p_status)
    AND (p_from_date IS NULL OR o.created_at >= p_from_date)
    AND (p_to_date IS NULL OR o.created_at <= p_to_date)
  ORDER BY o.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
