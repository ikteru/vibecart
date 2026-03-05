/**
 * Supabase implementation of SellerWeslatChannelRepository
 *
 * Manages the mapping between sellers and their dedicated Weslat channels.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SellerWeslatChannel,
  SellerWeslatChannelRepository,
  CreateSellerWeslatChannelInput,
} from '@/domain/repositories/SellerWeslatChannelRepository';

export class SupabaseSellerWeslatChannelRepository implements SellerWeslatChannelRepository {
  constructor(
    private supabase: SupabaseClient,
    private adminClient?: SupabaseClient
  ) {}

  async findBySellerId(sellerId: string): Promise<SellerWeslatChannel | null> {
    const { data, error } = await this.supabase
      .from('seller_weslat_channels')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    return this.toDomain(data);
  }

  async save(input: CreateSellerWeslatChannelInput): Promise<SellerWeslatChannel> {
    const client = this.adminClient || this.supabase;

    const { data, error } = await client
      .from('seller_weslat_channels')
      .upsert({
        seller_id: input.sellerId,
        weslat_channel_id: input.weslatChannelId,
        weslat_api_key_encrypted: input.weslatApiKeyEncrypted,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'seller_id',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save seller Weslat channel: ${error.message}`);
    }

    return this.toDomain(data);
  }

  async deactivate(sellerId: string): Promise<void> {
    const client = this.adminClient || this.supabase;

    const { error } = await client
      .from('seller_weslat_channels')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId);

    if (error) {
      throw new Error(`Failed to deactivate seller Weslat channel: ${error.message}`);
    }
  }

  private toDomain(row: Record<string, unknown>): SellerWeslatChannel {
    return {
      id: row.id as string,
      sellerId: row.seller_id as string,
      weslatChannelId: row.weslat_channel_id as string,
      weslatApiKeyEncrypted: row.weslat_api_key_encrypted as string,
      isActive: row.is_active as boolean,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
