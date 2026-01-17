-- ============================================================
-- VibeCart Initial Schema Migration
-- ============================================================
-- Creates the core tables for the marketplace:
-- - sellers: Shop owner profiles
-- - products: Product catalog
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Sellers Table
-- ============================================================
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Sellers Policies
-- ============================================================

-- Anyone can view seller profiles (public shop pages)
CREATE POLICY "Public read sellers"
  ON sellers
  FOR SELECT
  USING (true);

-- Users can insert their own seller profile
CREATE POLICY "Users create own seller"
  ON sellers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own seller profile
CREATE POLICY "Users update own seller"
  ON sellers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own seller profile
CREATE POLICY "Users delete own seller"
  ON sellers
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Products Policies
-- ============================================================

-- Anyone can view active products
CREATE POLICY "Public read active products"
  ON products
  FOR SELECT
  USING (is_active = true);

-- Sellers can view all their own products (including inactive)
CREATE POLICY "Sellers read own products"
  ON products
  FOR SELECT
  USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- Sellers can insert products
CREATE POLICY "Sellers create products"
  ON products
  FOR INSERT
  WITH CHECK (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- Sellers can update their own products
CREATE POLICY "Sellers update own products"
  ON products
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

-- Sellers can delete their own products
CREATE POLICY "Sellers delete own products"
  ON products
  FOR DELETE
  USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

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
