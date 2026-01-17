-- ============================================================
-- VibeCart Application Schema
-- ============================================================

-- ============================================================
-- Sellers Table
-- ============================================================
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,  -- Will reference auth.users after GoTrue sets it up
  shop_name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  whatsapp_number TEXT NOT NULL,
  shop_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT handle_format CHECK (handle ~ '^[a-z0-9_-]{3,30}$'),
  CONSTRAINT whatsapp_format CHECK (whatsapp_number ~ '^212[567]\d{8}$')
);

-- ============================================================
-- Products Table
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_amount INTEGER NOT NULL, -- stored in centimes (MAD * 100)
  price_currency TEXT NOT NULL DEFAULT 'MAD',
  discount_price_amount INTEGER,
  discount_price_currency TEXT,
  promotion_label TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  instagram_media_id TEXT,
  category TEXT NOT NULL,
  variants TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT price_positive CHECK (price_amount > 0),
  CONSTRAINT stock_non_negative CHECK (stock >= 0),
  CONSTRAINT valid_category CHECK (category IN ('clothing', 'shoes', 'jewelry', 'beauty', 'home', 'other')),
  CONSTRAINT media_required CHECK (video_url IS NOT NULL OR instagram_media_id IS NOT NULL)
);

-- ============================================================
-- Orders Table
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_neighborhood TEXT,
  address_street TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal INTEGER NOT NULL,
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  currency TEXT DEFAULT 'MAD',
  tracking_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'))
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

-- Sellers
CREATE INDEX IF NOT EXISTS idx_sellers_handle ON sellers(handle);
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_instagram_media_id ON products(instagram_media_id) WHERE instagram_media_id IS NOT NULL;

-- Full-text search index for product search
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('simple', title || ' ' || description));

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);

-- WhatsApp Commands
CREATE INDEX IF NOT EXISTS idx_whatsapp_commands_seller ON whatsapp_commands(seller_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_commands_buyer ON whatsapp_commands(buyer_phone);

-- ============================================================
-- Updated At Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sellers_updated_at
  BEFORE UPDATE ON sellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS) Policies - Basic version
-- Note: Full RLS with auth.uid() will be added after GoTrue starts
-- ============================================================

-- Enable RLS (but with permissive policies for local dev)
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_commands ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Sellers Policies (simplified for initial setup)
-- ============================================================

-- Anyone can view seller profiles (public shop pages)
CREATE POLICY "Public read sellers"
  ON sellers
  FOR SELECT
  USING (true);

-- Service role can do everything
CREATE POLICY "Service role full access sellers"
  ON sellers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Products Policies (simplified for initial setup)
-- ============================================================

-- Anyone can view active products
CREATE POLICY "Public read active products"
  ON products
  FOR SELECT
  USING (is_active = true);

-- Service role can do everything
CREATE POLICY "Service role full access products"
  ON products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Orders Policies (simplified for initial setup)
-- ============================================================

-- Service role can do everything
CREATE POLICY "Service role full access orders"
  ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- WhatsApp Commands Policies
-- ============================================================

-- Service role can do everything
CREATE POLICY "Service role full access commands"
  ON whatsapp_commands
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anyone can insert commands (webhook)
CREATE POLICY "Insert whatsapp commands"
  ON whatsapp_commands
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to search products with full-text search
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT,
  p_seller_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  seller_id UUID,
  title TEXT,
  description TEXT,
  price_amount INTEGER,
  price_currency TEXT,
  discount_price_amount INTEGER,
  discount_price_currency TEXT,
  promotion_label TEXT,
  stock INTEGER,
  video_url TEXT,
  instagram_media_id TEXT,
  category TEXT,
  variants TEXT[],
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.seller_id,
    p.title,
    p.description,
    p.price_amount,
    p.price_currency,
    p.discount_price_amount,
    p.discount_price_currency,
    p.promotion_label,
    p.stock,
    p.video_url,
    p.instagram_media_id,
    p.category,
    p.variants,
    p.is_active,
    p.created_at,
    p.updated_at,
    ts_rank(to_tsvector('simple', p.title || ' ' || p.description), plainto_tsquery('simple', search_query)) AS rank
  FROM products p
  WHERE
    (search_query IS NULL OR to_tsvector('simple', p.title || ' ' || p.description) @@ plainto_tsquery('simple', search_query))
    AND (p_seller_id IS NULL OR p.seller_id = p_seller_id)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_is_active IS NULL OR p.is_active = p_is_active)
  ORDER BY rank DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_products TO anon, authenticated, service_role;
