import { OrderDispatch } from '@/domain/entities/OrderDispatch';
import type { DeliveryPersonRepository } from '@/domain/repositories/DeliveryPersonRepository';
import type { OrderDispatchRepository } from '@/domain/repositories/OrderDispatchRepository';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderDispatchMapper } from '@/application/mappers/DeliveryMapper';
import type {
  CreateManualDispatchDTO,
  OrderDispatchDTO,
} from '@/application/dtos/DeliveryDTO';

/**
 * CreateManualDispatch Use Case Output
 */
export interface CreateManualDispatchOutput {
  success: boolean;
  dispatch?: OrderDispatchDTO;
  error?: string;
}

/**
 * CreateManualDispatch Use Case
 *
 * Creates a manual dispatch for an order to a delivery person.
 */
export class CreateManualDispatch {
  constructor(
    private orderDispatchRepository: OrderDispatchRepository,
    private deliveryPersonRepository: DeliveryPersonRepository,
    private orderRepository: OrderRepository
  ) {}

  async execute(input: CreateManualDispatchDTO): Promise<CreateManualDispatchOutput> {
    try {
      // Verify order exists and belongs to seller
      const order = await this.orderRepository.findById(input.orderId);
      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      if (order.sellerId !== input.sellerId) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      // Verify order is in a dispatchable state (confirmed or shipped)
      if (order.isPending() || order.isCancelled()) {
        return {
          success: false,
          error: 'Order must be confirmed before dispatching',
        };
      }

      // Check if order already has an active dispatch
      const hasActiveDispatch = await this.orderDispatchRepository.hasActiveDispatch(
        input.orderId
      );
      if (hasActiveDispatch) {
        return {
          success: false,
          error: 'Order already has an active dispatch',
        };
      }

      // Verify delivery person exists and belongs to seller
      const deliveryPerson = await this.deliveryPersonRepository.findByIdAndSeller(
        input.deliveryPersonId,
        input.sellerId
      );

      if (!deliveryPerson) {
        return {
          success: false,
          error: 'Delivery person not found',
        };
      }

      if (!deliveryPerson.isActive) {
        return {
          success: false,
          error: 'Delivery person is not active',
        };
      }

      // Create dispatch
      const dispatch = OrderDispatch.createManual({
        orderId: input.orderId,
        sellerId: input.sellerId,
        deliveryPersonId: input.deliveryPersonId,
        deliveryPersonName: deliveryPerson.name,
        deliveryPersonPhone: deliveryPerson.phone.value,
        codAmount: input.codAmount,
        notes: input.notes,
      });

      // Save dispatch
      await this.orderDispatchRepository.save(dispatch);

      // Update delivery person dispatch count (handled by trigger, but also update entity)
      deliveryPerson.recordDispatch();
      await this.deliveryPersonRepository.save(deliveryPerson);

      return {
        success: true,
        dispatch: OrderDispatchMapper.toDTO(dispatch),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create dispatch',
      };
    }
  }
}
