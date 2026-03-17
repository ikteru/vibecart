/**
 * FeedRepository - fetches products across all sellers for the public feed
 */

export interface FeedProductRow {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price_amount: number;
  price_currency: string;
  discount_price_amount?: number;
  discount_price_currency?: string;
  promotion_label?: string;
  stock: number;
  video_url?: string;
  category: string;
  variants?: string[];
  is_active: boolean;
  created_at: string;
  // Joined from sellers table
  shop_name: string;
  handle: string;
}

export interface FeedRepository {
  findPublicFeed(options: {
    limit: number;
    cursor?: string;
  }): Promise<{ products: FeedProductRow[]; nextCursor: string | null }>;
}
