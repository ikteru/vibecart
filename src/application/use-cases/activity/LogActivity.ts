/**
 * LogActivity Use Case
 *
 * Records a new activity log entry.
 */

import { ActivityLog } from '@/domain/entities/ActivityLog';
import { ActivityLogRepository } from '@/domain/repositories/ActivityLogRepository';
import { ActivityLogMapper } from '@/application/mappers/ActivityLogMapper';
import type {
  ActivityLogResponseDTO,
  CreateActivityLogDTO,
} from '@/application/dtos/ActivityLogDTO';

export interface LogActivityInput {
  sellerId: string;
  activity: CreateActivityLogDTO;
}

export interface LogActivityOutput {
  success: boolean;
  activity?: ActivityLogResponseDTO;
  error?: string;
}

export class LogActivity {
  constructor(private activityLogRepository: ActivityLogRepository) {}

  async execute(input: LogActivityInput): Promise<LogActivityOutput> {
    try {
      const { sellerId, activity: activityInput } = input;

      const activity = ActivityLog.create({
        sellerId,
        entityType: activityInput.entityType,
        entityId: activityInput.entityId,
        action: activityInput.action,
        changes: activityInput.changes,
        metadata: activityInput.metadata,
      });

      await this.activityLogRepository.save(activity);

      return {
        success: true,
        activity: ActivityLogMapper.toDTO(activity),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to log activity',
      };
    }
  }
}
