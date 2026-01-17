-- ============================================================
-- VibeCart Seed Data for Local Development
-- ============================================================

-- Create a test seller (using a placeholder user_id for local dev)
INSERT INTO sellers (
  id,
  user_id,
  shop_name,
  handle,
  whatsapp_number,
  shop_config,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Ayyuur Home',
  'ayyuur-home',
  '212612345678',
  '{
    "heroText": "Authentic Moroccan Crafts",
    "accentColor": "#10b981",
    "showCategories": true,
    "instagramHandle": "ayyuurhome"
  }',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test products
INSERT INTO products (
  id, seller_id, title, description, price_amount, price_currency,
  discount_price_amount, promotion_label, stock, video_url, category, variants, is_active
) VALUES
(
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'Handmade Berber Rug',
  'Authentic Moroccan craftsmanship, hand-woven by artisans in the Atlas Mountains',
  45000,
  'MAD',
  NULL,
  NULL,
  5,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'home',
  ARRAY['Small', 'Medium', 'Large'],
  true
),
(
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000002',
  'Ceramic Vase Collection',
  'Hand-painted traditional Fes designs',
  18000,
  'MAD',
  NULL,
  NULL,
  12,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'home',
  ARRAY[]::TEXT[],
  true
),
(
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000002',
  'Argan Oil Set',
  'Pure organic argan oil from the Souss region',
  28000,
  'MAD',
  22000,
  'Summer Sale',
  8,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'beauty',
  ARRAY['30ml', '50ml', '100ml'],
  true
),
(
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000002',
  'Leather Pouf Ottoman',
  'Genuine Moroccan leather pouf, hand-stitched in Marrakech',
  40000,
  'MAD',
  NULL,
  NULL,
  3,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'home',
  ARRAY['Natural', 'Brown', 'Black'],
  true
)
ON CONFLICT (id) DO NOTHING;

-- Create a test order
INSERT INTO orders (
  id, order_number, seller_id, customer_name, customer_phone,
  address_city, address_neighborhood, address_street,
  status, subtotal, shipping_cost, total, currency
) VALUES (
  '00000000-0000-0000-0000-000000000007',
  'ORD-0001',
  '00000000-0000-0000-0000-000000000002',
  'محمد أمين',
  '212698765432',
  'Casablanca',
  'Maarif',
  '123 Boulevard Zerktouni',
  'pending',
  45000,
  2500,
  47500,
  'MAD'
) ON CONFLICT (id) DO NOTHING;
