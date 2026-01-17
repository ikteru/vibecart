/**
 * Supabase Instagram Token Repository
 *
 * Implements InstagramTokenRepository using Supabase as the data store.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { InstagramTokenRepository } from '@/domain/repositories/InstagramTokenRepository';
import { InstagramToken } from '@/domain/entities/InstagramToken';
import type { InstagramTokenRow } from './types';

export class SupabaseInstagramTokenRepository implements InstagramTokenRepository {
  private supabase: SupabaseClient;
  private tableName = 'instagram_tokens';

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async findBySellerId(sellerId: string): Promise<InstagramToken | null> {
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
      throw new Error(`Failed to find Instagram token: ${error.message}`);
    }

    return this.toDomain(data as InstagramTokenRow);
  }

  async save(token: InstagramToken): Promise<void> {
    const row = this.toRow(token);

    // Upsert: insert or update on conflict (seller_id is unique)
    const { error } = await this.supabase
      .from(this.tableName)
      .upsert(row, {
        onConflict: 'seller_id',
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed to save Instagram token: ${error.message}`);
    }
  }

  async deleteBySellerId(sellerId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('seller_id', sellerId);

    if (error) {
      throw new Error(`Failed to delete Instagram token: ${error.message}`);
    }
  }

  async findExpiringTokens(daysUntilExpiry: number): Promise<InstagramToken[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysUntilExpiry);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .lte('expires_at', threshold.toISOString())
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to find expiring tokens: ${error.message}`);
    }

    return (data as InstagramTokenRow[]).map((row) => this.toDomain(row));
  }

  private toDomain(row: InstagramTokenRow): InstagramToken {
    return InstagramToken.fromPersistence({
      id: row.id,
      sellerId: row.seller_id,
      instagramUserId: row.instagram_user_id,
      instagramUsername: row.instagram_username,
      accessTokenEncrypted: row.access_token_encrypted,
      tokenType: row.token_type,
      expiresAt: new Date(row.expires_at),
      scopes: row.scopes || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toRow(token: InstagramToken): InstagramTokenRow {
    const props = token.toPersistence();
    return {
      id: props.id,
      seller_id: props.sellerId,
      instagram_user_id: props.instagramUserId,
      instagram_username: props.instagramUsername,
      access_token_encrypted: props.accessTokenEncrypted,
      token_type: props.tokenType,
      expires_at: props.expiresAt.toISOString(),
      scopes: props.scopes,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
    };
  }
}
