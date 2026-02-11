import { DeliveryPerson } from '@/domain/entities/DeliveryPerson';
import { OrderDispatch } from '@/domain/entities/OrderDispatch';
import type {
  DeliveryPersonDTO,
  OrderDispatchDTO,
  StatusHistoryEntryDTO,
} from '../dtos/DeliveryDTO';

/**
 * DeliveryPersonMapper
 *
 * Converts between DeliveryPerson domain entity and DTOs.
 */
export const DeliveryPersonMapper = {
  /**
   * Convert a DeliveryPerson entity to a response DTO
   */
  toDTO(deliveryPerson: DeliveryPerson): DeliveryPersonDTO {
    return {
      id: deliveryPerson.id,
      sellerId: deliveryPerson.sellerId,
      name: deliveryPerson.name,
      phone: deliveryPerson.phone.value,
      phoneDisplay: deliveryPerson.phone.toDisplayFormat(),
      notes: deliveryPerson.notes,
      isActive: deliveryPerson.isActive,
      dispatchCount: deliveryPerson.dispatchCount,
      lastDispatchedAt: deliveryPerson.lastDispatchedAt?.toISOString() || null,
      createdAt: deliveryPerson.createdAt.toISOString(),
      updatedAt: deliveryPerson.updatedAt.toISOString(),
    };
  },

  /**
   * Convert multiple DeliveryPerson entities to DTOs
   */
  toDTOList(deliveryPersons: DeliveryPerson[]): DeliveryPersonDTO[] {
    return deliveryPersons.map((dp) => DeliveryPersonMapper.toDTO(dp));
  },
};

/**
 * OrderDispatchMapper
 *
 * Converts between OrderDispatch domain entity and DTOs.
 */
export const OrderDispatchMapper = {
  /**
   * Convert an OrderDispatch entity to a response DTO
   */
  toDTO(dispatch: OrderDispatch): OrderDispatchDTO {
    const statusHistory: StatusHistoryEntryDTO[] = dispatch.statusHistory.map(
      (entry) => ({
        status: entry.status,
        timestamp: entry.timestamp.toISOString(),
        note: entry.note,
      })
    );

    return {
      id: dispatch.id,
      orderId: dispatch.orderId,
      sellerId: dispatch.sellerId,
      dispatchType: dispatch.dispatchType,

      // Manual dispatch
      deliveryPersonId: dispatch.deliveryPersonId,
      deliveryPersonName: dispatch.deliveryPersonName,
      deliveryPersonPhone: dispatch.deliveryPersonPhone?.value || null,
      deliveryPersonPhoneDisplay:
        dispatch.deliveryPersonPhone?.toDisplayFormat() || null,

      // API provider
      providerId: dispatch.providerId,
      externalTrackingId: dispatch.externalTrackingId,
      externalStatus: dispatch.externalStatus,

      // Pricing
      codAmount: dispatch.codAmount
        ? {
            amount: dispatch.codAmount.amount,
            currency: dispatch.codAmount.currency,
          }
        : null,

      // Status
      status: dispatch.status,
      statusHistory,
      whatsappSentAt: dispatch.whatsappSentAt?.toISOString() || null,
      notes: dispatch.notes,

      // Computed
      isPending: dispatch.isPending(),
      isCompleted: dispatch.isCompleted(),

      createdAt: dispatch.createdAt.toISOString(),
      updatedAt: dispatch.updatedAt.toISOString(),
    };
  },

  /**
   * Convert multiple OrderDispatch entities to DTOs
   */
  toDTOList(dispatches: OrderDispatch[]): OrderDispatchDTO[] {
    return dispatches.map((dispatch) => OrderDispatchMapper.toDTO(dispatch));
  },
};
