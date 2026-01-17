/**
 * ActivityLog DTOs
 *
 * Data Transfer Objects for activity log data.
 */

import type { EntityType, ActivityAction } from '@/domain/entities/ActivityLog';

/**
 * Activity log response for API/UI
 */
export interface ActivityLogResponseDTO {
  id: string;
  sellerId: string;
  entityType: EntityType;
  entityId: string | null;
  action: ActivityAction;
  changes: Record<string, { old?: unknown; new?: unknown }>;
  metadata: Record<string, unknown>;
  description: string; // Human-readable description
  createdAt: string; // ISO string
}

/**
 * Input for creating an activity log
 */
export interface CreateActivityLogDTO {
  entityType: EntityType;
  entityId?: string;
  action: ActivityAction;
  changes?: Record<string, { old?: unknown; new?: unknown }>;
  metadata?: Record<string, unknown>;
}

/**
 * Options for fetching activity logs
 */
export interface GetActivityOptionsDTO {
  entityType?: EntityType;
  limit?: number;
  offset?: number;
}
