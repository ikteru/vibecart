import type { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '@/domain/entities/Product';
import { ProductRepository } from '@/domain/repositories/ProductRepository';
import { Money } from '@/domain/value-objects/Money';
import { ProductCategory, ProductCategoryType } from '@/domain/value-objects/ProductCategory';
import type { ProductRow } from './types';

/**
 * SupabaseProductRepository
 *
 * Supabase implementation of the ProductRepository interface.
 */
export class SupabaseProductRepository implements ProductRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as ProductRow);
  }

  async findByInstagramMediaId(mediaId: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('instagram_media_id', mediaId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as ProductRow);
  }

  async findBySellerId(
    sellerId: string,
    options?: {
      category?: ProductCategoryType;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Product[]> {
    let query = this.supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId);

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 20) - 1
      );
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data.map((row) => this.toDomain(row as ProductRow));
  }

  async search(
    searchQuery: string,
    options?: {
      sellerId?: string;
      category?: ProductCategoryType;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Product[]> {
    // Use the search_products function for full-text search
    const { data, error } = await this.supabase.rpc('search_products', {
      search_query: searchQuery,
      p_seller_id: options?.sellerId || null,
      p_category: options?.category || null,
      p_is_active: options?.isActive ?? null,
      p_limit: options?.limit || 20,
      p_offset: options?.offset || 0,
    });

    if (error || !data) {
      // Fallback to simple ILIKE search if function doesn't exist
      return this.fallbackSearch(searchQuery, options);
    }

    return data.map((row: ProductRow) => this.toDomain(row));
  }

  private async fallbackSearch(
    searchQuery: string,
    options?: {
      sellerId?: string;
      category?: ProductCategoryType;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Product[]> {
    let query = this.supabase
      .from('products')
      .select('*')
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

    if (options?.sellerId) {
      query = query.eq('seller_id', options.sellerId);
    }

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 20) - 1
      );
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data.map((row) => this.toDomain(row as ProductRow));
  }

  async save(product: Product): Promise<void> {
    const row = this.toRow(product);

    const { error } = await this.supabase
      .from('products')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save product: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  async countBySellerId(
    sellerId: string,
    options?: {
      category?: ProductCategoryType;
      isActive?: boolean;
    }
  ): Promise<number> {
    let query = this.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    const { count, error } = await query;

    if (error) {
      return 0;
    }

    return count || 0;
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: ProductRow): Product {
    return Product.fromPersistence({
      id: row.id,
      sellerId: row.seller_id,
      title: row.title,
      description: row.description,
      price: Money.fromCents(row.price_amount, row.price_currency as 'MAD' | 'USD' | 'EUR'),
      discountPrice: row.discount_price_amount
        ? Money.fromCents(
            row.discount_price_amount,
            (row.discount_price_currency || row.price_currency) as 'MAD' | 'USD' | 'EUR'
          )
        : undefined,
      promotionLabel: row.promotion_label || undefined,
      stock: row.stock,
      videoUrl: row.video_url || undefined,
      instagramMediaId: row.instagram_media_id || undefined,
      category: ProductCategory.create(row.category),
      variants: row.variants || [],
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Convert domain entity to database row
   */
  private toRow(product: Product): ProductRow {
    const props = product.toPersistence();

    return {
      id: props.id,
      seller_id: props.sellerId,
      title: props.title,
      description: props.description,
      price_amount: props.price.toCents(),
      price_currency: props.price.currency,
      discount_price_amount: props.discountPrice?.toCents() || null,
      discount_price_currency: props.discountPrice?.currency || null,
      promotion_label: props.promotionLabel || null,
      stock: props.stock,
      video_url: props.videoUrl || null,
      instagram_media_id: props.instagramMediaId || null,
      category: props.category.value,
      variants: props.variants,
      is_active: props.isActive,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
    };
  }
}
