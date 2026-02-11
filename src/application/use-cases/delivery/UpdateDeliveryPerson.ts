import type { DeliveryPersonRepository } from '@/domain/repositories/DeliveryPersonRepository';
import { DeliveryPersonMapper } from '@/application/mappers/DeliveryMapper';
import type {
  UpdateDeliveryPersonDTO,
  DeliveryPersonDTO,
} from '@/application/dtos/DeliveryDTO';

/**
 * UpdateDeliveryPerson Use Case Output
 */
export interface UpdateDeliveryPersonOutput {
  success: boolean;
  deliveryPerson?: DeliveryPersonDTO;
  error?: string;
}

/**
 * UpdateDeliveryPerson Use Case
 *
 * Updates an existing delivery person.
 */
export class UpdateDeliveryPerson {
  constructor(private deliveryPersonRepository: DeliveryPersonRepository) {}

  async execute(input: UpdateDeliveryPersonDTO): Promise<UpdateDeliveryPersonOutput> {
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

      // If phone is being updated, check for duplicates
      if (input.phone && input.phone !== deliveryPerson.phone.value) {
        const exists = await this.deliveryPersonRepository.existsByPhoneAndSeller(
          input.phone,
          input.sellerId,
          input.id
        );

        if (exists) {
          return {
            success: false,
            error: 'A delivery person with this phone number already exists',
          };
        }
      }

      // Update entity
      deliveryPerson.update({
        name: input.name,
        phone: input.phone,
        notes: input.notes,
        isActive: input.isActive,
      });

      // Save to repository
      await this.deliveryPersonRepository.save(deliveryPerson);

      return {
        success: true,
        deliveryPerson: DeliveryPersonMapper.toDTO(deliveryPerson),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update delivery person',
      };
    }
  }
}
