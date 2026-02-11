import type { OrderDispatchRepository } from '@/domain/repositories/OrderDispatchRepository';
import { OrderDispatchMapper } from '@/application/mappers/DeliveryMapper';
import type { OrderDispatchDTO } from '@/application/dtos/DeliveryDTO';

/**
 * GetOrderDispatches Use Case Input
 */
export interface GetOrderDispatchesInput {
  orderId: string;
  sellerId: string;
}

/**
 * GetOrderDispatches Use Case Output
 */
export interface GetOrderDispatchesOutput {
  success: boolean;
  dispatches?: OrderDispatchDTO[];
  error?: string;
}

/**
 * GetOrderDispatches Use Case
 *
 * Gets all dispatches for an order.
 */
export class GetOrderDispatches {
  constructor(private orderDispatchRepository: OrderDispatchRepository) {}

  async execute(input: GetOrderDispatchesInput): Promise<GetOrderDispatchesOutput> {
    try {
      // Fetch dispatches for the order
      const dispatches = await this.orderDispatchRepository.findByOrderId(input.orderId);

      // Filter to only include dispatches for this seller
      const sellerDispatches = dispatches.filter((d) => d.sellerId === input.sellerId);

      return {
        success: true,
        dispatches: OrderDispatchMapper.toDTOList(sellerDispatches),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dispatches',
      };
    }
  }
}
