/**
 * Supabase WhatsApp Token Repository
 *
 * Implements WhatsAppTokenRepository using Supabase as the data store.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { WhatsAppTokenRepository } from '@/domain/repositories/WhatsAppTokenRepository';
import { WhatsAppBusinessToken } from '@/domain/entities/WhatsAppBusinessToken';
import type { WhatsAppBusinessTokenRow } from './types';

export class SupabaseWhatsAppTokenRepository implements WhatsAppTokenRepository {
  private supabase: SupabaseClient;
  private tableName = 'whatsapp_business_tokens';

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async findBySellerId(sellerId: string): Promise<WhatsAppBusinessToken | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to find WhatsApp token: ${error.message}`);
    }

    return this.toDomain(data as WhatsAppBusinessTokenRow);
  }

  async save(token: WhatsAppBusinessToken): Promise<void> {
    const row = this.toRow(token);

    // Upsert: insert or update on conflict (seller_id is unique)
    const { error } = await this.supabase
      .from(this.tableName)
      .upsert(row, {
        onConflict: 'seller_id',
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed to save WhatsApp token: ${error.message}`);
    }
  }

  async deleteBySellerId(sellerId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('seller_id', sellerId);

    if (error) {
      throw new Error(`Failed to delete WhatsApp token: ${error.message}`);
    }
  }

  async findExpiringTokens(daysUntilExpiry: number): Promise<WhatsAppBusinessToken[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysUntilExpiry);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .not('token_expires_at', 'is', null)
      .lte('token_expires_at', threshold.toISOString())
      .gt('token_expires_at', new Date().toISOString())
      .order('token_expires_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to find expiring tokens: ${error.message}`);
    }

    return (data as WhatsAppBusinessTokenRow[]).map((row) => this.toDomain(row));
  }

  async findActiveTokens(): Promise<WhatsAppBusinessToken[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('connected_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find active tokens: ${error.message}`);
    }

    return (data as WhatsAppBusinessTokenRow[]).map((row) => this.toDomain(row));
  }

  async findByPhoneNumberId(phoneNumberId: string): Promise<WhatsAppBusinessToken | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('phone_number_id', phoneNumberId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to find WhatsApp token by phone number ID: ${error.message}`);
    }

    return this.toDomain(data as WhatsAppBusinessTokenRow);
  }

  private toDomain(row: WhatsAppBusinessTokenRow): WhatsAppBusinessToken {
    return WhatsAppBusinessToken.fromPersistence({
      id: row.id,
      sellerId: row.seller_id,
      phoneNumberId: row.phone_number_id,
      displayPhoneNumber: row.display_phone_number,
      businessAccountId: row.business_account_id,
      accessTokenEncrypted: row.access_token_encrypted,
      tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at) : null,
      isActive: row.is_active,
      connectedAt: new Date(row.connected_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toRow(token: WhatsAppBusinessToken): WhatsAppBusinessTokenRow {
    const props = token.toPersistence();
    return {
      id: props.id,
      seller_id: props.sellerId,
      phone_number_id: props.phoneNumberId,
      display_phone_number: props.displayPhoneNumber,
      business_account_id: props.businessAccountId,
      access_token_encrypted: props.accessTokenEncrypted,
      token_expires_at: props.tokenExpiresAt?.toISOString() || null,
      is_active: props.isActive,
      connected_at: props.connectedAt.toISOString(),
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
    };
  }
}
