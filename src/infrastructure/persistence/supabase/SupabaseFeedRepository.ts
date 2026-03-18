/**
 * SupabaseFeedRepository - Supabase implementation of FeedRepository
 *
 * Fetches active products with video across all sellers, joined with seller info.
 * Uses admin client since this is a public endpoint with no auth context.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FeedRepository, FeedProductRow } from '@/domain/repositories/FeedRepository';

export class SupabaseFeedRepository implements FeedRepository {
  constructor(private supabase: SupabaseClient) {}

  async findPublicFeed(options: {
    limit: number;
    cursor?: string;
  }): Promise<{ products: FeedProductRow[]; nextCursor: string | null }> {
    const { limit, cursor } = options;

    let query = this.supabase
      .from('products')
      .select(`
        id,
        seller_id,
        title,
        description,
        price_amount,
        price_currency,
        discount_price_amount,
        discount_price_currency,
        promotion_label,
        stock,
        video_url,
        category,
        variants,
        is_active,
        created_at,
        sellers!inner (
          shop_name,
          handle
        )
      `)
      .eq('is_active', true)
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to determine if there are more

    if (cursor) {
      // Cursor is the created_at of the last item in the previous page
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('SupabaseFeedRepository.findPublicFeed error:', error);
      return { products: [], nextCursor: null };
    }

    const hasMore = data.length > limit;
    const products = (hasMore ? data.slice(0, limit) : data).map((row: Record<string, unknown>) => {
      const seller = row.sellers as Record<string, string>;
      return {
        id: row.id as string,
        seller_id: row.seller_id as string,
        title: row.title as string,
        description: (row.description as string) || '',
        price_amount: row.price_amount as number,
        price_currency: row.price_currency as string,
        discount_price_amount: row.discount_price_amount as number | undefined,
        discount_price_currency: row.discount_price_currency as string | undefined,
        promotion_label: row.promotion_label as string | undefined,
        stock: row.stock as number,
        video_url: row.video_url as string | undefined,
        category: row.category as string,
        variants: row.variants as string[] | undefined,
        is_active: row.is_active as boolean,
        created_at: row.created_at as string,
        shop_name: seller.shop_name,
        handle: seller.handle,
      } as FeedProductRow;
    });

    const nextCursor = hasMore && products.length > 0
      ? products[products.length - 1].created_at
      : null;

    return { products, nextCursor };
  }
}
