/**
 * GetSellerActivity Use Case
 *
 * Retrieves activity logs for a seller's dashboard.
 */

import { ActivityLogRepository } from '@/domain/repositories/ActivityLogRepository';
import { ActivityLogMapper } from '@/application/mappers/ActivityLogMapper';
import type {
  ActivityLogResponseDTO,
  GetActivityOptionsDTO,
} from '@/application/dtos/ActivityLogDTO';

export interface GetSellerActivityInput {
  sellerId: string;
  options?: GetActivityOptionsDTO;
}

export interface GetSellerActivityOutput {
  success: boolean;
  activities: ActivityLogResponseDTO[];
  error?: string;
}

export class GetSellerActivity {
  constructor(private activityLogRepository: ActivityLogRepository) {}

  async execute(input: GetSellerActivityInput): Promise<GetSellerActivityOutput> {
    try {
      const { sellerId, options } = input;

      const activities = await this.activityLogRepository.findBySellerId(
        sellerId,
        {
          entityType: options?.entityType,
          limit: options?.limit || 20,
          offset: options?.offset || 0,
        }
      );

      return {
        success: true,
        activities: ActivityLogMapper.toDTOArray(activities),
      };
    } catch (error) {
      return {
        success: false,
        activities: [],
        error: error instanceof Error ? error.message : 'Failed to fetch activity',
      };
    }
  }
}
