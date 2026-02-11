import type { DeliveryPersonRepository } from '@/domain/repositories/DeliveryPersonRepository';
import { DeliveryPersonMapper } from '@/application/mappers/DeliveryMapper';
import type {
  DeliveryPersonListQueryDTO,
  DeliveryPersonListResponseDTO,
} from '@/application/dtos/DeliveryDTO';

/**
 * GetSellerDeliveryPersons Use Case Output
 */
export interface GetSellerDeliveryPersonsOutput {
  success: boolean;
  data?: DeliveryPersonListResponseDTO;
  error?: string;
}

/**
 * GetSellerDeliveryPersons Use Case
 *
 * Gets all delivery persons for a seller.
 */
export class GetSellerDeliveryPersons {
  constructor(private deliveryPersonRepository: DeliveryPersonRepository) {}

  async execute(input: DeliveryPersonListQueryDTO): Promise<GetSellerDeliveryPersonsOutput> {
    try {
      const limit = input.limit || 50;
      const offset = input.offset || 0;

      // Fetch delivery persons
      const deliveryPersons = await this.deliveryPersonRepository.findBySellerId(
        input.sellerId,
        {
          activeOnly: input.activeOnly,
          limit: limit + 1, // Fetch one extra to check if there are more
          offset,
        }
      );

      // Check if there are more results
      const hasMore = deliveryPersons.length > limit;
      const results = hasMore ? deliveryPersons.slice(0, limit) : deliveryPersons;

      // Get total count
      const total = await this.deliveryPersonRepository.countBySellerId(
        input.sellerId,
        input.activeOnly
      );

      return {
        success: true,
        data: {
          deliveryPersons: DeliveryPersonMapper.toDTOList(results),
          total,
          limit,
          offset,
          hasMore,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch delivery persons',
      };
    }
  }
}
