/**
 * ActivityLogRepository Interface
 *
 * Defines the contract for activity log persistence.
 */

import { ActivityLog, EntityType } from '../entities/ActivityLog';

export interface GetActivityOptions {
  entityType?: EntityType;
  limit?: number;
  offset?: number;
}

export interface ActivityLogRepository {
  /**
   * Save an activity log entry
   */
  save(activity: ActivityLog): Promise<void>;

  /**
   * Find activity logs by seller ID
   */
  findBySellerId(
    sellerId: string,
    options?: GetActivityOptions
  ): Promise<ActivityLog[]>;

  /**
   * Find activity logs by entity ID
   */
  findByEntityId(entityId: string, limit?: number): Promise<ActivityLog[]>;

  /**
   * Count activity logs for a seller
   */
  countBySellerId(sellerId: string, entityType?: EntityType): Promise<number>;
}
