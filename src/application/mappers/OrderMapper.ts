import { Order } from '@/domain/entities/Order';
import type {
  OrderResponseDTO,
  OrderSummaryDTO,
  OrderItemDTO,
  ChatMessageDTO,
  AddressDTO,
} from '../dtos/OrderDTO';

/**
 * OrderMapper
 *
 * Converts between Order domain entity and DTOs.
 */
export const OrderMapper = {
  /**
   * Convert an Order entity to a full response DTO
   */
  toDTO(order: Order): OrderResponseDTO {
    const props = order.toPersistence();

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      sellerId: order.sellerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone.toDisplayFormat(),
      shippingAddress: this.addressToDTO(order.shippingAddress),
      items: props.items.map((item) => this.itemToDTO(item)),
      subtotal: {
        amount: order.subtotal.amount,
        currency: order.subtotal.currency,
      },
      shippingCost: {
        amount: order.shippingCost.amount,
        currency: order.shippingCost.currency,
      },
      total: {
        amount: order.total.amount,
        currency: order.total.currency,
      },
      status: order.status,
      messages: props.messages.map((msg) => this.messageToDTO(msg)),
      isPending: order.isPending(),
      isConfirmed: order.isConfirmed(),
      isShipped: order.isShipped(),
      isDelivered: order.isDelivered(),
      isCancelled: order.isCancelled(),
      isCompleted: order.isCompleted(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      confirmedAt: order.confirmedAt?.toISOString() || null,
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
    };
  },

  /**
   * Convert an Order entity to a summary DTO for lists
   */
  toSummaryDTO(order: Order): OrderSummaryDTO {
    const items = order.items;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Create items summary like "2x Berber Rug, 1x Vase"
    const itemsSummary = items
      .map((item) => `${item.quantity}x ${item.title}`)
      .join(', ');

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone.toDisplayFormat(),
      itemCount,
      itemsSummary,
      total: {
        amount: order.total.amount,
        currency: order.total.currency,
      },
      status: order.status,
      hasUnreadMessages: false, // TODO: Implement unread tracking
      createdAt: order.createdAt.toISOString(),
    };
  },

  /**
   * Convert multiple Order entities to summary DTOs
   */
  toSummaryDTOList(orders: Order[]): OrderSummaryDTO[] {
    return orders.map((order) => this.toSummaryDTO(order));
  },

  /**
   * Convert multiple Order entities to full DTOs
   */
  toDTOList(orders: Order[]): OrderResponseDTO[] {
    return orders.map((order) => this.toDTO(order));
  },

  /**
   * Convert Address to DTO
   */
  addressToDTO(address: Order['shippingAddress']): AddressDTO {
    const json = address.toJSON();
    return {
      city: json.city,
      neighborhood: json.neighborhood || null,
      street: json.street,
      buildingName: json.buildingName || null,
      floor: json.floor || null,
      apartmentNumber: json.apartmentNumber || null,
      deliveryInstructions: json.deliveryInstructions || null,
      location: json.location || null,
      locationUrl: json.locationUrl || null,
    };
  },

  /**
   * Convert OrderItem to DTO
   */
  itemToDTO(item: Order['items'][0]): OrderItemDTO {
    return {
      id: item.id,
      productId: item.productId,
      title: item.title,
      price: {
        amount: item.price.amount,
        currency: item.price.currency,
      },
      quantity: item.quantity,
      selectedVariant: item.selectedVariant || null,
      subtotal: {
        amount: item.price.multiply(item.quantity).amount,
        currency: item.price.currency,
      },
    };
  },

  /**
   * Convert ChatMessage to DTO
   */
  messageToDTO(message: Order['messages'][0]): ChatMessageDTO {
    return {
      id: message.id,
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };
  },
};
