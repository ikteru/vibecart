/**
 * Supabase WhatsApp Message Repository
 *
 * Implements WhatsAppMessageRepository using Supabase as the data store.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { WhatsAppMessageRepository } from '@/domain/repositories/WhatsAppMessageRepository';
import { WhatsAppMessage, MessageStatus } from '@/domain/entities/WhatsAppMessage';
import type { WhatsAppMessageRow } from './types';

export class SupabaseWhatsAppMessageRepository implements WhatsAppMessageRepository {
  private supabase: SupabaseClient;
  private tableName = 'whatsapp_messages';

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async create(message: WhatsAppMessage): Promise<void> {
    const row = this.toRow(message);

    const { error } = await this.supabase
      .from(this.tableName)
      .insert(row);

    if (error) {
      throw new Error(`Failed to create WhatsApp message: ${error.message}`);
    }
  }

  async findById(id: string): Promise<WhatsAppMessage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find WhatsApp message: ${error.message}`);
    }

    return this.toDomain(data as WhatsAppMessageRow);
  }

  async findByWhatsAppMessageId(whatsappMessageId: string): Promise<WhatsAppMessage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('whatsapp_message_id', whatsappMessageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find WhatsApp message by wamid: ${error.message}`);
    }

    return this.toDomain(data as WhatsAppMessageRow);
  }

  async updateStatus(
    id: string,
    status: MessageStatus,
    options?: {
      whatsappMessageId?: string;
      errorCode?: string;
      errorMessage?: string;
      timestamp?: Date;
    }
  ): Promise<void> {
    const updates: Record<string, unknown> = { status };

    if (options?.whatsappMessageId) {
      updates.whatsapp_message_id = options.whatsappMessageId;
    }

    if (options?.errorCode) {
      updates.error_code = options.errorCode;
    }

    if (options?.errorMessage) {
      updates.error_message = options.errorMessage;
    }

    const timestamp = options?.timestamp || new Date();

    if (status === 'SENT') {
      updates.sent_at = timestamp.toISOString();
    } else if (status === 'DELIVERED') {
      updates.delivered_at = timestamp.toISOString();
    } else if (status === 'READ') {
      updates.read_at = timestamp.toISOString();
    }

    const { error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update WhatsApp message status: ${error.message}`);
    }
  }

  async findByOrderId(orderId: string): Promise<WhatsAppMessage[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find WhatsApp messages by order: ${error.message}`);
    }

    return (data as WhatsAppMessageRow[]).map((row) => this.toDomain(row));
  }

  async findBySellerId(
    sellerId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: MessageStatus;
    }
  ): Promise<WhatsAppMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find WhatsApp messages by seller: ${error.message}`);
    }

    return (data as WhatsAppMessageRow[]).map((row) => this.toDomain(row));
  }

  async countBySellerId(sellerId: string, status?: MessageStatus): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    if (status) {
      query = query.eq('status', status);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count WhatsApp messages: ${error.message}`);
    }

    return count || 0;
  }

  private toDomain(row: WhatsAppMessageRow): WhatsAppMessage {
    return WhatsAppMessage.fromPersistence({
      id: row.id,
      sellerId: row.seller_id,
      orderId: row.order_id || undefined,
      whatsappMessageId: row.whatsapp_message_id || undefined,
      recipientPhone: row.recipient_phone,
      templateName: row.template_name || undefined,
      messageType: row.message_type as 'template' | 'text' | 'interactive',
      messageContent: row.message_content as Record<string, unknown>,
      status: row.status as MessageStatus,
      errorCode: row.error_code || undefined,
      errorMessage: row.error_message || undefined,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
      readAt: row.read_at ? new Date(row.read_at) : undefined,
      createdAt: new Date(row.created_at),
    });
  }

  private toRow(message: WhatsAppMessage): WhatsAppMessageRow {
    const props = message.toPersistence();
    return {
      id: props.id,
      seller_id: props.sellerId,
      order_id: props.orderId || null,
      whatsapp_message_id: props.whatsappMessageId || null,
      recipient_phone: props.recipientPhone,
      template_name: props.templateName || null,
      message_type: props.messageType,
      message_content: props.messageContent,
      status: props.status,
      error_code: props.errorCode || null,
      error_message: props.errorMessage || null,
      sent_at: props.sentAt?.toISOString() || null,
      delivered_at: props.deliveredAt?.toISOString() || null,
      read_at: props.readAt?.toISOString() || null,
      created_at: props.createdAt.toISOString(),
    };
  }
}
