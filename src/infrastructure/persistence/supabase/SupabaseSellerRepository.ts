import type { SupabaseClient } from '@supabase/supabase-js';
import { Seller, ShopConfig } from '@/domain/entities/Seller';
import { SellerRepository } from '@/domain/repositories/SellerRepository';
import { PhoneNumber } from '@/domain/value-objects/PhoneNumber';
import type { SellerRow } from './types';

/**
 * SupabaseSellerRepository
 *
 * Supabase implementation of the SellerRepository interface.
 * Optionally accepts an admin client for write operations to bypass RLS
 * (authorization is verified in the application layer).
 */
export class SupabaseSellerRepository implements SellerRepository {
  constructor(
    private supabase: SupabaseClient,
    private adminClient?: SupabaseClient
  ) {}

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

    // Check if seller exists (use update for existing, insert for new)
    const { data: existing } = await this.supabase
      .from('sellers')
      .select('id, user_id')
      .eq('id', row.id)
      .single();

    if (existing) {
      // When admin client is provided, caller has already verified authorization
      // (e.g., Instagram login callback verifies user via admin API)
      // When no admin client, verify auth context matches the seller's user_id
      if (!this.adminClient) {
        const {
          data: { user: authUser },
        } = await this.supabase.auth.getUser();

        if (!authUser) {
          throw new Error('Failed to save seller: Not authenticated');
        }

        if (authUser.id !== existing.user_id) {
          throw new Error('Failed to save seller: Not authorized to update this seller');
        }
      }

      // Use admin client for update if available (bypasses RLS since auth verified above)
      const updateClient = this.adminClient || this.supabase;

      // Update existing seller
      const { error: updateError } = await updateClient
        .from('sellers')
        .update({
          shop_name: row.shop_name,
          handle: row.handle,
          whatsapp_number: row.whatsapp_number,
          shop_config: row.shop_config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      if (updateError) {
        throw new Error(`Failed to save seller: ${updateError.message}`);
      }
    } else {
      // Insert new seller - use admin client if available
      const insertClient = this.adminClient || this.supabase;
      const { error } = await insertClient
        .from('sellers')
        .insert(row);

      if (error) {
        throw new Error(`Failed to save seller: ${error.message}`);
      }
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
      whatsappNumber: row.whatsapp_number ? PhoneNumber.fromJSON(row.whatsapp_number) : null,
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
      whatsapp_number: props.whatsappNumber?.value ?? null,
      shop_config: props.shopConfig as Record<string, unknown>,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
    };
  }
}
