/**
 * Supabase Database Types
 *
 * Row types for database tables.
 */

export interface SellerRow {
  id: string;
  user_id: string;
  shop_name: string;
  handle: string;
  whatsapp_number: string;
  shop_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price_amount: number;
  price_currency: string;
  discount_price_amount: number | null;
  discount_price_currency: string | null;
  promotion_label: string | null;
  stock: number;
  video_url: string | null;
  instagram_media_id: string | null;
  category: string;
  variants: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
