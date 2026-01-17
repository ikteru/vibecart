-- ============================================================
-- VibeCart Seed Data for Local Development
-- ============================================================

-- Delete existing products to refresh with Arabic data
DELETE FROM products WHERE seller_id = '00000000-0000-0000-0000-000000000002';

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
  'دار أيور',
  'dar-ayyuur',
  '212612345678',
  '{
    "heroText": "الحرف المغربية الأصيلة",
    "accentColor": "#10b981",
    "showCategories": true,
    "instagramHandle": "darayyuur"
  }',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  handle = EXCLUDED.handle,
  shop_config = EXCLUDED.shop_config,
  updated_at = NOW();

-- Create test products in Arabic
INSERT INTO products (
  id, seller_id, title, description, price_amount, price_currency,
  discount_price_amount, promotion_label, stock, video_url, category, variants, is_active
) VALUES
(
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'زربية أمازيغية يدوية',
  'صناعة مغربية أصيلة، منسوجة يدوياً من طرف حرفيين في جبال الأطلس. خيوط صوف طبيعية وألوان تقليدية.',
  45000,
  'MAD',
  NULL,
  NULL,
  5,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'home',
  ARRAY['صغير', 'وسط', 'كبير'],
  true
),
(
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000002',
  'مجموعة مزهريات خزفية',
  'تصاميم فاسية تقليدية مرسومة يدوياً. كل قطعة فريدة من نوعها.',
  18000,
  'MAD',
  NULL,
  NULL,
  12,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'home',
  ARRAY['مزهرية صغيرة', 'مزهرية متوسطة', 'طقم كامل'],
  true
),
(
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000002',
  'طقم زيت الأركان',
  'زيت أركان عضوي نقي من منطقة سوس. مثالي للعناية بالبشرة والشعر.',
  28000,
  'MAD',
  22000,
  'تخفيض الصيف',
  8,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'beauty',
  ARRAY['30 مل', '50 مل', '100 مل'],
  true
),
(
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000002',
  'بوف جلدي مراكشي',
  'بوف من الجلد المغربي الأصيل، مخيط يدوياً في مراكش. مثالي للصالون أو غرفة المعيشة.',
  40000,
  'MAD',
  NULL,
  NULL,
  3,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'home',
  ARRAY['طبيعي', 'بني', 'أسود'],
  true
),
(
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000002',
  'قفطان مغربي تقليدي',
  'قفطان فاخر مطرز يدوياً بخيوط ذهبية. تصميم عصري مستوحى من التراث.',
  85000,
  'MAD',
  75000,
  'عرض خاص',
  4,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'clothing',
  ARRAY['S', 'M', 'L', 'XL'],
  true
),
(
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000002',
  'بابوش مغربي جلدي',
  'بابوش تقليدي من الجلد الطبيعي. صناعة فاسية أصيلة ومريحة للقدمين.',
  12000,
  'MAD',
  NULL,
  NULL,
  20,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'shoes',
  ARRAY['38', '39', '40', '41', '42', '43'],
  true
),
(
  '00000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000002',
  'عقد فضي أمازيغي',
  'عقد من الفضة الأصيلة بتصميم أمازيغي تقليدي. قطعة فريدة تجمع بين الأصالة والأناقة.',
  32000,
  'MAD',
  NULL,
  NULL,
  6,
  'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'jewelry',
  ARRAY['قصير', 'متوسط', 'طويل'],
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_amount = EXCLUDED.price_amount,
  discount_price_amount = EXCLUDED.discount_price_amount,
  promotion_label = EXCLUDED.promotion_label,
  stock = EXCLUDED.stock,
  variants = EXCLUDED.variants,
  updated_at = NOW();

-- Create a test order
INSERT INTO orders (
  id, order_number, seller_id, customer_name, customer_phone,
  address_city, address_neighborhood, address_street,
  status, subtotal, shipping_cost, total, currency
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  'ORD-0001',
  '00000000-0000-0000-0000-000000000002',
  'محمد أمين',
  '212698765432',
  'الدار البيضاء',
  'المعاريف',
  '123 شارع الزرقطوني',
  'pending',
  45000,
  2500,
  47500,
  'MAD'
) ON CONFLICT (id) DO NOTHING;
