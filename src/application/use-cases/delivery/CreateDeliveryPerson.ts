import { DeliveryPerson } from '@/domain/entities/DeliveryPerson';
import type { DeliveryPersonRepository } from '@/domain/repositories/DeliveryPersonRepository';
import { DeliveryPersonMapper } from '@/application/mappers/DeliveryMapper';
import type {
  CreateDeliveryPersonDTO,
  DeliveryPersonDTO,
} from '@/application/dtos/DeliveryDTO';

/**
 * CreateDeliveryPerson Use Case Output
 */
export interface CreateDeliveryPersonOutput {
  success: boolean;
  deliveryPerson?: DeliveryPersonDTO;
  error?: string;
}

/**
 * CreateDeliveryPerson Use Case
 *
 * Creates a new delivery person for a seller.
 */
export class CreateDeliveryPerson {
  constructor(private deliveryPersonRepository: DeliveryPersonRepository) {}

  async execute(input: CreateDeliveryPersonDTO): Promise<CreateDeliveryPersonOutput> {
    try {
      // Check if a delivery person with the same phone already exists
      const exists = await this.deliveryPersonRepository.existsByPhoneAndSeller(
        input.phone,
        input.sellerId
      );

      if (exists) {
        return {
          success: false,
          error: 'A delivery person with this phone number already exists',
        };
      }

      // Create domain entity (validation happens here)
      const deliveryPerson = DeliveryPerson.create({
        sellerId: input.sellerId,
        name: input.name,
        phone: input.phone,
        notes: input.notes,
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
        error: error instanceof Error ? error.message : 'Failed to create delivery person',
      };
    }
  }
}
