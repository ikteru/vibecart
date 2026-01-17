import type { SupabaseClient } from '@supabase/supabase-js';
import { Seller, ShopConfig } from '@/domain/entities/Seller';
import { SellerRepository } from '@/domain/repositories/SellerRepository';
import { PhoneNumber } from '@/domain/value-objects/PhoneNumber';
import type { SellerRow } from './types';

/**
 * SupabaseSellerRepository
 *
 * Supabase implementation of the SellerRepository interface.
 */
export class SupabaseSellerRepository implements SellerRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Seller | null> {
    const { data, error } = await this.supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as SellerRow);
  }

  async findByHandle(handle: string): Promise<Seller | null> {
    const normalizedHandle = handle.toLowerCase();

    const { data, error } = await this.supabase
      .from('sellers')
      .select('*')
      .eq('handle', normalizedHandle)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as SellerRow);
  }

  async findByUserId(userId: string): Promise<Seller | null> {
    const { data, error } = await this.supabase
      .from('sellers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as SellerRow);
  }

  async isHandleAvailable(
    handle: string,
    excludeSellerId?: string
  ): Promise<boolean> {
    const normalizedHandle = handle.toLowerCase();

    let query = this.supabase
      .from('sellers')
      .select('id', { count: 'exact', head: true })
      .eq('handle', normalizedHandle);

    if (excludeSellerId) {
      query = query.neq('id', excludeSellerId);
    }

    const { count, error } = await query;

    if (error) {
      return false;
    }

    return (count || 0) === 0;
  }

  async save(seller: Seller): Promise<void> {
    const row = this.toRow(seller);

    const { error } = await this.supabase
      .from('sellers')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save seller: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('sellers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete seller: ${error.message}`);
    }
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: SellerRow): Seller {
    return Seller.fromPersistence({
      id: row.id,
      userId: row.user_id,
      shopName: row.shop_name,
      handle: row.handle,
      whatsappNumber: PhoneNumber.fromJSON(row.whatsapp_number),
      shopConfig: (row.shop_config || {}) as ShopConfig,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Convert domain entity to database row
   */
  private toRow(seller: Seller): SellerRow {
    const props = seller.toPersistence();

    return {
      id: props.id,
      user_id: props.userId,
      shop_name: props.shopName,
      handle: props.handle,
      whatsapp_number: props.whatsappNumber.value,
      shop_config: props.shopConfig as Record<string, unknown>,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
    };
  }
}
