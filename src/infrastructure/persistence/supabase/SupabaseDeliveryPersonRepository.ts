import type { SupabaseClient } from '@supabase/supabase-js';
import { DeliveryPerson } from '@/domain/entities/DeliveryPerson';
import type { DeliveryPersonRepository } from '@/domain/repositories/DeliveryPersonRepository';
import { PhoneNumber } from '@/domain/value-objects/PhoneNumber';
import type { DeliveryPersonRow } from './types';

/**
 * SupabaseDeliveryPersonRepository
 *
 * Supabase implementation of the DeliveryPersonRepository interface.
 */
export class SupabaseDeliveryPersonRepository implements DeliveryPersonRepository {
  constructor(
    private supabase: SupabaseClient,
    private adminClient?: SupabaseClient
  ) {}

  async findById(id: string): Promise<DeliveryPerson | null> {
    const { data, error } = await this.supabase
      .from('delivery_persons')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as DeliveryPersonRow);
  }

  async findByIdAndSeller(id: string, sellerId: string): Promise<DeliveryPerson | null> {
    const { data, error } = await this.supabase
      .from('delivery_persons')
      .select('*')
      .eq('id', id)
      .eq('seller_id', sellerId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as DeliveryPersonRow);
  }

  async findBySellerId(
    sellerId: string,
    options?: {
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<DeliveryPerson[]> {
    let query = this.supabase
      .from('delivery_persons')
      .select('*')
      .eq('seller_id', sellerId);

    if (options?.activeOnly) {
      query = query.eq('is_active', true);
    }

    query = query.order('name', { ascending: true });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data.map((row) => this.toDomain(row as DeliveryPersonRow));
  }

  async save(deliveryPerson: DeliveryPerson): Promise<void> {
    const client = this.adminClient || this.supabase;
    const row = this.toRow(deliveryPerson);

    const { error } = await client.from('delivery_persons').upsert(row, {
      onConflict: 'id',
    });

    if (error) {
      throw new Error(`Failed to save delivery person: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const client = this.adminClient || this.supabase;

    const { error } = await client
      .from('delivery_persons')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete delivery person: ${error.message}`);
    }
  }

  async countBySellerId(sellerId: string, activeOnly?: boolean): Promise<number> {
    let query = this.supabase
      .from('delivery_persons')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { count, error } = await query;

    if (error) {
      return 0;
    }

    return count || 0;
  }

  async existsByPhoneAndSeller(
    phone: string,
    sellerId: string,
    excludeId?: string
  ): Promise<boolean> {
    // Normalize phone number for comparison
    const normalizedPhone = PhoneNumber.create(phone).value;

    let query = this.supabase
      .from('delivery_persons')
      .select('id')
      .eq('seller_id', sellerId)
      .eq('phone', normalizedPhone);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.limit(1);

    return data !== null && data.length > 0;
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: DeliveryPersonRow): DeliveryPerson {
    return DeliveryPerson.fromPersistence({
      id: row.id,
      sellerId: row.seller_id,
      name: row.name,
      phone: PhoneNumber.create(row.phone),
      notes: row.notes || undefined,
      isActive: row.is_active,
      dispatchCount: row.dispatch_count,
      lastDispatchedAt: row.last_dispatched_at
        ? new Date(row.last_dispatched_at)
        : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Convert domain entity to database row
   */
  private toRow(deliveryPerson: DeliveryPerson): DeliveryPersonRow {
    const props = deliveryPerson.toPersistence();
    return {
      id: props.id,
      seller_id: props.sellerId,
      name: props.name,
      phone: props.phone.value,
      notes: props.notes || null,
      is_active: props.isActive,
      dispatch_count: props.dispatchCount,
      last_dispatched_at: props.lastDispatchedAt?.toISOString() || null,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
    };
  }
}
