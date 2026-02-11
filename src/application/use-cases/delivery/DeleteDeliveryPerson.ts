import type { DeliveryPersonRepository } from '@/domain/repositories/DeliveryPersonRepository';

/**
 * DeleteDeliveryPerson Use Case Input
 */
export interface DeleteDeliveryPersonInput {
  id: string;
  sellerId: string;
}

/**
 * DeleteDeliveryPerson Use Case Output
 */
export interface DeleteDeliveryPersonOutput {
  success: boolean;
  error?: string;
}

/**
 * DeleteDeliveryPerson Use Case
 *
 * Deletes a delivery person for a seller.
 */
export class DeleteDeliveryPerson {
  constructor(private deliveryPersonRepository: DeliveryPersonRepository) {}

  async execute(input: DeleteDeliveryPersonInput): Promise<DeleteDeliveryPersonOutput> {
    try {
      // Find delivery person and verify ownership
      const deliveryPerson = await this.deliveryPersonRepository.findByIdAndSeller(
        input.id,
        input.sellerId
      );

      if (!deliveryPerson) {
        return {
          success: false,
          error: 'Delivery person not found',
        };
      }

      // Delete from repository
      await this.deliveryPersonRepository.delete(input.id);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete delivery person',
      };
    }
  }
}
