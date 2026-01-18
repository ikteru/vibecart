/**
 * Supabase WhatsApp Template Repository
 *
 * Implements WhatsAppTemplateRepository using Supabase as the data store.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { WhatsAppTemplateRepository } from '@/domain/repositories/WhatsAppTemplateRepository';
import {
  WhatsAppMessageTemplate,
  TemplateStatus,
  TemplateLanguage,
  TemplateCategory,
  TemplateComponent,
} from '@/domain/entities/WhatsAppMessageTemplate';
import type { WhatsAppMessageTemplateRow } from './types';

export class SupabaseWhatsAppTemplateRepository implements WhatsAppTemplateRepository {
  private supabase: SupabaseClient;
  private tableName = 'whatsapp_message_templates';

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async create(template: WhatsAppMessageTemplate): Promise<void> {
    const row = this.toRow(template);

    const { error } = await this.supabase.from(this.tableName).insert(row);

    if (error) {
      if (error.code === '23505') {
        throw new Error(
          `Template with name "${template.templateName}" already exists for this language`
        );
      }
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  async findById(id: string): Promise<WhatsAppMessageTemplate | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find template: ${error.message}`);
    }

    return this.toDomain(data as WhatsAppMessageTemplateRow);
  }

  async findBySellerIdAndName(
    sellerId: string,
    templateName: string,
    language?: string
  ): Promise<WhatsAppMessageTemplate | null> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('seller_id', sellerId)
      .eq('template_name', templateName);

    if (language) {
      query = query.eq('template_language', language);
    }

    const { data, error } = await query.limit(1).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find template by name: ${error.message}`);
    }

    return this.toDomain(data as WhatsAppMessageTemplateRow);
  }

  async findByMetaTemplateId(metaTemplateId: string): Promise<WhatsAppMessageTemplate | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('meta_template_id', metaTemplateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find template by Meta ID: ${error.message}`);
    }

    return this.toDomain(data as WhatsAppMessageTemplateRow);
  }

  async findBySellerId(
    sellerId: string,
    options?: {
      status?: TemplateStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<WhatsAppMessageTemplate[]> {
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
      throw new Error(`Failed to find templates by seller: ${error.message}`);
    }

    return (data as WhatsAppMessageTemplateRow[]).map((row) => this.toDomain(row));
  }

  async update(template: WhatsAppMessageTemplate): Promise<void> {
    const row = this.toRow(template);

    const { error } = await this.supabase.from(this.tableName).update(row).eq('id', template.id);

    if (error) {
      if (error.code === '23505') {
        throw new Error(
          `Template with name "${template.templateName}" already exists for this language`
        );
      }
      throw new Error(`Failed to update template: ${error.message}`);
    }
  }

  async updateStatus(
    id: string,
    status: TemplateStatus,
    options?: {
      metaTemplateId?: string;
      rejectionReason?: string;
    }
  ): Promise<void> {
    const updates: Record<string, unknown> = { status };

    if (options?.metaTemplateId !== undefined) {
      updates.meta_template_id = options.metaTemplateId;
    }

    if (options?.rejectionReason !== undefined) {
      updates.rejection_reason = options.rejectionReason;
    }

    const { error } = await this.supabase.from(this.tableName).update(updates).eq('id', id);

    if (error) {
      throw new Error(`Failed to update template status: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from(this.tableName).delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  async countBySellerId(sellerId: string, status?: TemplateStatus): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    if (status) {
      query = query.eq('status', status);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count templates: ${error.message}`);
    }

    return count || 0;
  }

  async existsBySellerIdAndName(
    sellerId: string,
    templateName: string,
    language?: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('template_name', templateName);

    if (language) {
      query = query.eq('template_language', language);
    }

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to check template existence: ${error.message}`);
    }

    return (count || 0) > 0;
  }

  private toDomain(row: WhatsAppMessageTemplateRow): WhatsAppMessageTemplate {
    return WhatsAppMessageTemplate.fromPersistence({
      id: row.id,
      sellerId: row.seller_id,
      metaTemplateId: row.meta_template_id || undefined,
      templateName: row.template_name,
      templateLanguage: row.template_language as TemplateLanguage,
      category: row.category as TemplateCategory,
      status: row.status as TemplateStatus,
      rejectionReason: row.rejection_reason || undefined,
      description: row.description || undefined,
      components: row.components as unknown as TemplateComponent[],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toRow(template: WhatsAppMessageTemplate): WhatsAppMessageTemplateRow {
    const props = template.toPersistence();
    return {
      id: props.id,
      seller_id: props.sellerId,
      meta_template_id: props.metaTemplateId || null,
      template_name: props.templateName,
      template_language: props.templateLanguage,
      category: props.category,
      status: props.status,
      rejection_reason: props.rejectionReason || null,
      description: props.description || null,
      components: props.components as unknown as Record<string, unknown>[],
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
    };
  }
}
