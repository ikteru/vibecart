import type { OrderDispatchRepository } from '@/domain/repositories/OrderDispatchRepository';
import { OrderDispatchMapper } from '@/application/mappers/DeliveryMapper';
import type {
  UpdateDispatchStatusDTO,
  OrderDispatchDTO,
} from '@/application/dtos/DeliveryDTO';

/**
 * UpdateDispatchStatus Use Case Output
 */
export interface UpdateDispatchStatusOutput {
  success: boolean;
  dispatch?: OrderDispatchDTO;
  error?: string;
}

/**
 * UpdateDispatchStatus Use Case
 *
 * Updates the status of a dispatch.
 */
export class UpdateDispatchStatus {
  constructor(private orderDispatchRepository: OrderDispatchRepository) {}

  async execute(input: UpdateDispatchStatusDTO): Promise<UpdateDispatchStatusOutput> {
    try {
      // Find dispatch and verify ownership
      const dispatch = await this.orderDispatchRepository.findByIdAndSeller(
        input.dispatchId,
        input.sellerId
      );

      if (!dispatch) {
        return {
          success: false,
          error: 'Dispatch not found',
        };
      }

      // Update status
      dispatch.updateStatus(input.status, input.note);

      // Save to repository
      await this.orderDispatchRepository.save(dispatch);

      return {
        success: true,
        dispatch: OrderDispatchMapper.toDTO(dispatch),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update dispatch status',
      };
    }
  }
}
