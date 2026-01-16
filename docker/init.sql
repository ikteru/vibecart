-- VibeCart Database Initialization
-- This script runs on first container startup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE product_category AS ENUM ('clothing', 'shoes', 'jewelry', 'beauty', 'home', 'other');
CREATE TYPE message_sender AS ENUM ('buyer', 'seller', 'system');
CREATE TYPE locale_code AS ENUM ('ar-MA', 'ar', 'fr', 'en');

-- Users table (standalone for local dev, in production linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  preferred_locale locale_code DEFAULT 'ar-MA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sellers table
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  handle VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  instagram_handle VARCHAR(100),
  instagram_access_token TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT handle_format CHECK (handle ~ '^[a-z0-9_-]+$')
);

CREATE INDEX idx_sellers_user_id ON sellers(user_id);
CREATE INDEX idx_sellers_handle ON sellers(handle);

-- Shop configurations
CREATE TABLE shop_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID UNIQUE NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,

  -- WhatsApp Integration
  whatsapp_enabled BOOLEAN DEFAULT TRUE,
  whatsapp_business_number VARCHAR(20),
  whatsapp_business_name VARCHAR(255),
  whatsapp_welcome_message TEXT,

  -- Instagram Integration
  instagram_connected BOOLEAN DEFAULT FALSE,
  instagram_handle VARCHAR(100),
  instagram_profile_image TEXT,

  -- Google Maps Integration
  google_maps_enabled BOOLEAN DEFAULT FALSE,
  google_maps_place_id VARCHAR(255),
  google_maps_rating DECIMAL(2,1),
  google_maps_reviews INTEGER,
  google_maps_place_name VARCHAR(255),

  -- Shipping
  default_shipping_rate DECIMAL(10,2) DEFAULT 35.00,

  -- Spotlight Offer
  spotlight_enabled BOOLEAN DEFAULT FALSE,
  spotlight_config JSONB DEFAULT '{}',

  -- Maker Bio
  maker_bio_enabled BOOLEAN DEFAULT FALSE,
  maker_bio_config JSONB DEFAULT '{}',

  -- Reviews (Instagram stories)
  reviews JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping rules per city
CREATE TABLE shipping_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  city VARCHAR(100) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,

  UNIQUE(seller_id, city)
);

CREATE INDEX idx_shipping_rules_seller ON shipping_rules(seller_id);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2),
  promotion_label VARCHAR(100),
  currency CHAR(3) DEFAULT 'MAD',
  stock INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  instagram_media_id VARCHAR(100),
  category product_category NOT NULL,
  variants TEXT[] DEFAULT '{}',

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_price CHECK (price > 0),
  CONSTRAINT positive_stock CHECK (stock >= 0)
);

CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,

  -- Customer info (guest checkout)
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,

  -- Shipping address
  address_city VARCHAR(100) NOT NULL,
  address_neighborhood VARCHAR(200),
  address_street TEXT NOT NULL,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_url TEXT,

  -- Order status
  status order_status NOT NULL DEFAULT 'pending',

  -- Financials
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'MAD',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Snapshot at order time
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_variant VARCHAR(100),

  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  sender message_sender NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_order ON chat_messages(order_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Moroccan cities reference table
CREATE TABLE moroccan_cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  name_ar VARCHAR(100)
);

-- Moroccan neighborhoods reference table
CREATE TABLE moroccan_neighborhoods (
  id SERIAL PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES moroccan_cities(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),

  UNIQUE(city_id, name)
);

CREATE INDEX idx_neighborhoods_city ON moroccan_neighborhoods(city_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_configs_updated_at BEFORE UPDATE ON shop_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'ORD-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
  FOR EACH ROW WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- WhatsApp Commands (Slash Commands)
-- Tracks command history for analytics and debugging
CREATE TABLE whatsapp_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  buyer_phone VARCHAR(20) NOT NULL,
  raw_message TEXT NOT NULL,
  parsed_command VARCHAR(50),
  command_args JSONB DEFAULT '{}',
  execution_result JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_commands_seller ON whatsapp_commands(seller_id);
CREATE INDEX idx_whatsapp_commands_buyer ON whatsapp_commands(buyer_phone);
CREATE INDEX idx_whatsapp_commands_created ON whatsapp_commands(created_at DESC);

-- Shipping providers (for future shipping aggregator feature)
CREATE TABLE shipping_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  api_endpoint TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller shipping provider preferences
CREATE TABLE seller_shipping_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES shipping_providers(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  credentials_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(seller_id, provider_id)
);

-- Individual shipments
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES shipping_providers(id),
  tracking_number VARCHAR(100),
  label_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  quoted_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number) WHERE tracking_number IS NOT NULL;
