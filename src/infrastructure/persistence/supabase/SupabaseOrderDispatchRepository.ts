import type { SupabaseClient } from '@supabase/supabase-js';
import {
  OrderDispatch,
  type DispatchStatus,
  type DispatchType,
  type StatusHistoryEntry,
} from '@/domain/entities/OrderDispatch';
import type { OrderDispatchRepository } from '@/domain/repositories/OrderDispatchRepository';
import { Money } from '@/domain/value-objects/Money';
import { PhoneNumber } from '@/domain/value-objects/PhoneNumber';
import type { OrderDispatchRow } from './types';

/**
 * SupabaseOrderDispatchRepository
 *
 * Supabase implementation of the OrderDispatchRepository interface.
 */
export class SupabaseOrderDispatchRepository implements OrderDispatchRepository {
  constructor(
    private supabase: SupabaseClient,
    private adminClient?: SupabaseClient
  ) {}

  async findById(id: string): Promise<OrderDispatch | null> {
    const { data, error } = await this.supabase
      .from('order_dispatches')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as OrderDispatchRow);
  }

  async findByIdAndSeller(id: string, sellerId: string): Promise<OrderDispatch | null> {
    const { data, error } = await this.supabase
      .from('order_dispatches')
      .select('*')
      .eq('id', id)
      .eq('seller_id', sellerId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as OrderDispatchRow);
  }

  async findByOrderId(orderId: string): Promise<OrderDispatch[]> {
    const { data, error } = await this.supabase
      .from('order_dispatches')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row) => this.toDomain(row as OrderDispatchRow));
  }

  async findLatestByOrderId(orderId: string): Promise<OrderDispatch | null> {
    const { data, error } = await this.supabase
      .from('order_dispatches')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as OrderDispatchRow);
  }

  async findBySellerId(
    sellerId: string,
    options?: {
      status?: DispatchStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<OrderDispatch[]> {
    let query = this.supabase
      .from('order_dispatches')
      .select('*')
      .eq('seller_id', sellerId);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    query = query.order('created_at', { ascending: false });

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

    return data.map((row) => this.toDomain(row as OrderDispatchRow));
  }

  async findByDeliveryPersonId(
    deliveryPersonId: string,
    options?: {
      status?: DispatchStatus;
      limit?: number;
    }
  ): Promise<OrderDispatch[]> {
    let query = this.supabase
      .from('order_dispatches')
      .select('*')
      .eq('delivery_person_id', deliveryPersonId);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data.map((row) => this.toDomain(row as OrderDispatchRow));
  }

  async save(dispatch: OrderDispatch): Promise<void> {
    const client = this.adminClient || this.supabase;
    const row = this.toRow(dispatch);

    const { error } = await client.from('order_dispatches').upsert(row, {
      onConflict: 'id',
    });

    if (error) {
      throw new Error(`Failed to save dispatch: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const client = this.adminClient || this.supabase;

    const { error } = await client.from('order_dispatches').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete dispatch: ${error.message}`);
    }
  }

  async countByOrderId(orderId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('order_dispatches')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId);

    if (error) {
      return 0;
    }

    return count || 0;
  }

  async hasActiveDispatch(orderId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('order_dispatches')
      .select('id')
      .eq('order_id', orderId)
      .not('status', 'in', '("delivered","failed","returned")')
      .limit(1);

    return data !== null && data.length > 0;
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: OrderDispatchRow): OrderDispatch {
    const statusHistory: StatusHistoryEntry[] = (row.status_history || []).map(
      (entry) => ({
        status: entry.status as DispatchStatus,
        timestamp: new Date(entry.timestamp),
        note: entry.note,
      })
    );

    return OrderDispatch.fromPersistence({
      id: row.id,
      orderId: row.order_id,
      sellerId: row.seller_id,
      dispatchType: row.dispatch_type as DispatchType,
      deliveryPersonId: row.delivery_person_id || undefined,
      deliveryPersonName: row.delivery_person_name || undefined,
      deliveryPersonPhone: row.delivery_person_phone
        ? PhoneNumber.create(row.delivery_person_phone)
        : undefined,
      providerId: row.provider_id || undefined,
      externalTrackingId: row.external_tracking_id || undefined,
      externalStatus: row.external_status || undefined,
      codAmount: row.cod_amount !== null ? Money.create(row.cod_amount) : undefined,
      status: row.status as DispatchStatus,
      statusHistory,
      whatsappSentAt: row.whatsapp_sent_at
        ? new Date(row.whatsapp_sent_at)
        : undefined,
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Convert domain entity to database row
   */
  private toRow(dispatch: OrderDispatch): OrderDispatchRow {
    const props = dispatch.toPersistence();
    return {
      id: props.id,
      order_id: props.orderId,
      seller_id: props.sellerId,
      dispatch_type: props.dispatchType,
      delivery_person_id: props.deliveryPersonId || null,
      delivery_person_name: props.deliveryPersonName || null,
      delivery_person_phone: props.deliveryPersonPhone?.value || null,
      provider_id: props.providerId || null,
      external_tracking_id: props.externalTrackingId || null,
      external_status: props.externalStatus || null,
      cod_amount: props.codAmount?.amount ?? null,
      status: props.status,
      status_history: props.statusHistory.map((entry) => ({
        status: entry.status,
        timestamp: entry.timestamp.toISOString(),
        note: entry.note,
      })),
      whatsapp_sent_at: props.whatsappSentAt?.toISOString() || null,
      notes: props.notes || null,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
    };
  }
}
