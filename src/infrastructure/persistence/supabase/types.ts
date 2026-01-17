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

export interface OrderRow {
  id: string;
  order_number: string;
  seller_id: string;
  customer_name: string;
  customer_phone: string;
  address_city: string;
  address_neighborhood: string | null;
  address_street: string;
  address_building_name: string | null;
  address_floor: string | null;
  address_apartment_number: string | null;
  address_delivery_instructions: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_url: string | null;
  status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  currency: string;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  title: string;
  price_amount: number;
  price_currency: string;
  quantity: number;
  selected_variant: string | null;
  created_at: string;
}

export interface OrderMessageRow {
  id: string;
  order_id: string;
  sender: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface WhatsAppCommandRow {
  id: string;
  seller_id: string;
  buyer_phone: string;
  raw_message: string;
  parsed_command: string | null;
  command_args: Record<string, unknown>;
  execution_result: Record<string, unknown>;
  created_at: string;
}

export interface ActivityLogRow {
  id: string;
  seller_id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  changes: Record<string, { old?: unknown; new?: unknown }>;
  metadata: Record<string, unknown>;
  created_at: string;
}
