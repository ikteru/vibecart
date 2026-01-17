import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ActivityLog,
  EntityType,
  ActivityAction,
} from '@/domain/entities/ActivityLog';
import {
  ActivityLogRepository,
  GetActivityOptions,
} from '@/domain/repositories/ActivityLogRepository';
import type { ActivityLogRow } from './types';

/**
 * SupabaseActivityLogRepository
 *
 * Supabase implementation of the ActivityLogRepository interface.
 */
export class SupabaseActivityLogRepository implements ActivityLogRepository {
  constructor(private supabase: SupabaseClient) {}

  async save(activity: ActivityLog): Promise<void> {
    const row = this.toRow(activity);

    const { error } = await this.supabase.from('activity_logs').insert(row);

    if (error) {
      throw new Error(`Failed to save activity log: ${error.message}`);
    }
  }

  async findBySellerId(
    sellerId: string,
    options?: GetActivityOptions
  ): Promise<ActivityLog[]> {
    let query = this.supabase
      .from('activity_logs')
      .select('*')
      .eq('seller_id', sellerId);

    if (options?.entityType) {
      query = query.eq('entity_type', options.entityType);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 20) - 1
      );
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data.map((row) => this.toDomain(row as ActivityLogRow));
  }

  async findByEntityId(entityId: string, limit = 20): Promise<ActivityLog[]> {
    const { data, error } = await this.supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((row) => this.toDomain(row as ActivityLogRow));
  }

  async countBySellerId(
    sellerId: string,
    entityType?: EntityType
  ): Promise<number> {
    let query = this.supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { count, error } = await query;

    if (error) {
      return 0;
    }

    return count || 0;
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: ActivityLogRow): ActivityLog {
    return ActivityLog.fromPersistence({
      id: row.id,
      sellerId: row.seller_id,
      entityType: row.entity_type as EntityType,
      entityId: row.entity_id,
      action: row.action as ActivityAction,
      changes: row.changes || {},
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
    });
  }

  /**
   * Convert domain entity to database row
   */
  private toRow(activity: ActivityLog): ActivityLogRow {
    const props = activity.toPersistence();

    return {
      id: props.id,
      seller_id: props.sellerId,
      entity_type: props.entityType,
      entity_id: props.entityId,
      action: props.action,
      changes: props.changes,
      metadata: props.metadata,
      created_at: props.createdAt.toISOString(),
    };
  }
}
