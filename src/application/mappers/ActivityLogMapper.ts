/**
 * ActivityLogMapper
 *
 * Maps ActivityLog entities to DTOs.
 */

import { ActivityLog } from '@/domain/entities/ActivityLog';
import type { ActivityLogResponseDTO } from '@/application/dtos/ActivityLogDTO';

export class ActivityLogMapper {
  /**
   * Map entity to response DTO
   */
  static toDTO(activity: ActivityLog): ActivityLogResponseDTO {
    return {
      id: activity.id,
      sellerId: activity.sellerId,
      entityType: activity.entityType,
      entityId: activity.entityId,
      action: activity.action,
      changes: activity.changes,
      metadata: activity.metadata,
      description: activity.getDescription(),
      createdAt: activity.createdAt.toISOString(),
    };
  }

  /**
   * Map array of entities to DTOs
   */
  static toDTOArray(activities: ActivityLog[]): ActivityLogResponseDTO[] {
    return activities.map((a) => this.toDTO(a));
  }
}
