/**
 * Supabase Template Event Binding Repository
 *
 * Implements TemplateEventBindingRepository using Supabase as the data store.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TemplateEventBindingRepository } from '@/domain/repositories/TemplateEventBindingRepository';
import {
  TemplateEventBinding,
  NotificationEventType,
} from '@/domain/entities/TemplateEventBinding';
import type { TemplateEventBindingRow, WhatsAppMessageTemplateRow } from './types';

export class SupabaseTemplateEventBindingRepository implements TemplateEventBindingRepository {
  private supabase: SupabaseClient;
  private tableName = 'whatsapp_template_event_bindings';

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async upsert(binding: TemplateEventBinding): Promise<void> {
    const row = this.toRow(binding);

    const { error } = await this.supabase.from(this.tableName).upsert(row, {
      onConflict: 'seller_id,event_type',
    });

    if (error) {
      throw new Error(`Failed to upsert event binding: ${error.message}`);
    }
  }

  async findById(id: string): Promise<TemplateEventBinding | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find event binding: ${error.message}`);
    }

    return this.toDomain(data as TemplateEventBindingRow);
  }

  async findBySellerIdAndEventType(
    sellerId: string,
    eventType: NotificationEventType
  ): Promise<TemplateEventBinding | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('seller_id', sellerId)
      .eq('event_type', eventType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find event binding: ${error.message}`);
    }

    return this.toDomain(data as TemplateEventBindingRow);
  }

  async findBySellerId(sellerId: string): Promise<TemplateEventBinding[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('seller_id', sellerId)
      .order('event_type', { ascending: true });

    if (error) {
      throw new Error(`Failed to find event bindings by seller: ${error.message}`);
    }

    return (data as TemplateEventBindingRow[]).map((row) => this.toDomain(row));
  }

  async findByTemplateId(templateId: string): Promise<TemplateEventBinding[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('template_id', templateId);

    if (error) {
      throw new Error(`Failed to find event bindings by template: ${error.message}`);
    }

    return (data as TemplateEventBindingRow[]).map((row) => this.toDomain(row));
  }

  async update(binding: TemplateEventBinding): Promise<void> {
    const row = this.toRow(binding);

    const { error } = await this.supabase.from(this.tableName).update(row).eq('id', binding.id);

    if (error) {
      throw new Error(`Failed to update event binding: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from(this.tableName).delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete event binding: ${error.message}`);
    }
  }

  async deleteByTemplateId(templateId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('template_id', templateId);

    if (error) {
      throw new Error(`Failed to delete event bindings by template: ${error.message}`);
    }
  }

  async getActiveBindingWithTemplate(
    sellerId: string,
    eventType: NotificationEventType
  ): Promise<{
    binding: TemplateEventBinding;
    templateName: string;
    templateLanguage: string;
    metaTemplateId: string | null;
    components: unknown[];
  } | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        whatsapp_message_templates!inner (
          template_name,
          template_language,
          meta_template_id,
          components,
          status
        )
      `
      )
      .eq('seller_id', sellerId)
      .eq('event_type', eventType)
      .eq('is_enabled', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get active binding with template: ${error.message}`);
    }

    const row = data as TemplateEventBindingRow & {
      whatsapp_message_templates: WhatsAppMessageTemplateRow;
    };

    // Only return if template is approved
    if (row.whatsapp_message_templates.status !== 'APPROVED') {
      return null;
    }

    return {
      binding: this.toDomain(row),
      templateName: row.whatsapp_message_templates.template_name,
      templateLanguage: row.whatsapp_message_templates.template_language,
      metaTemplateId: row.whatsapp_message_templates.meta_template_id,
      components: row.whatsapp_message_templates.components,
    };
  }

  private toDomain(row: TemplateEventBindingRow): TemplateEventBinding {
    return TemplateEventBinding.fromPersistence({
      id: row.id,
      sellerId: row.seller_id,
      eventType: row.event_type as NotificationEventType,
      templateId: row.template_id,
      isEnabled: row.is_enabled,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toRow(binding: TemplateEventBinding): TemplateEventBindingRow {
    const props = binding.toPersistence();
    return {
      id: props.id,
      seller_id: props.sellerId,
      event_type: props.eventType,
      template_id: props.templateId,
      is_enabled: props.isEnabled,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
    };
  }
}
