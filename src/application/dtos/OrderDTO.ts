import type { OrderStatus } from '@/domain/entities/Order';

/**
 * Order Item DTO
 */
export interface OrderItemDTO {
  id: string;
  productId: string | null;
  title: string;
  price: {
    amount: number;
    currency: string;
  };
  quantity: number;
  selectedVariant: string | null;
  subtotal: {
    amount: number;
    currency: string;
  };
}

/**
 * Chat Message DTO
 */
export interface ChatMessageDTO {
  id: string;
  sender: 'buyer' | 'seller' | 'system';
  content: string;
  createdAt: string;
}

/**
 * Address DTO
 */
export interface AddressDTO {
  city: string;
  neighborhood: string | null;
  street: string;
  buildingName: string | null;
  floor: string | null;
  apartmentNumber: string | null;
  deliveryInstructions: string | null;
  location: {
    lat: number;
    lng: number;
  } | null;
  locationUrl: string | null;
}

/**
 * Order Response DTO
 *
 * Full order data for API responses.
 */
export interface OrderResponseDTO {
  id: string;
  orderNumber: string;
  sellerId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: AddressDTO;
  items: OrderItemDTO[];
  subtotal: {
    amount: number;
    currency: string;
  };
  shippingCost: {
    amount: number;
    currency: string;
  };
  total: {
    amount: number;
    currency: string;
  };
  status: OrderStatus;
  messages: ChatMessageDTO[];
  isPending: boolean;
  isConfirmed: boolean;
  isShipped: boolean;
  isDelivered: boolean;
  isCancelled: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

/**
 * Order Summary DTO
 *
 * Lightweight order data for lists.
 */
export interface OrderSummaryDTO {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  itemsSummary: string;
  total: {
    amount: number;
    currency: string;
  };
  status: OrderStatus;
  hasUnreadMessages: boolean;
  createdAt: string;
}

/**
 * Create Order Input Item
 */
export interface CreateOrderItemInput {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  selectedVariant?: string;
}

/**
 * Create Order DTO
 *
 * Input for creating a new order from checkout.
 */
export interface CreateOrderDTO {
  sellerId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: {
    city: string;
    neighborhood?: string;
    street: string;
    buildingName?: string;
    floor?: string;
    apartmentNumber?: string;
    deliveryInstructions?: string;
    location?: {
      lat: number;
      lng: number;
    };
    locationUrl?: string;
  };
  items: CreateOrderItemInput[];
  shippingCost: number;
}

/**
 * Update Order Status DTO
 */
export interface UpdateOrderStatusDTO {
  orderId: string;
  action: 'confirm' | 'ship' | 'deliver' | 'cancel';
  trackingNumber?: string;
  cancelReason?: string;
  sendNotification?: boolean; // Send WhatsApp notification (default: true if connected)
}

/**
 * Add Order Message DTO
 */
export interface AddOrderMessageDTO {
  orderId: string;
  sender: 'buyer' | 'seller';
  content: string;
}

/**
 * Order List Query DTO
 */
export interface OrderListQueryDTO {
  sellerId: string;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

/**
 * Order List Response DTO
 */
export interface OrderListResponseDTO {
  orders: OrderSummaryDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Order Stats DTO
 *
 * Seller dashboard statistics.
 */
export interface OrderStatsDTO {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  currency: string;
  ordersToday: number;
}
