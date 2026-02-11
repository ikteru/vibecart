import type { DispatchStatus, DispatchType } from '@/domain/entities/OrderDispatch';

// ============================================================
// Delivery Person DTOs
// ============================================================

/**
 * Delivery Person Response DTO
 */
export interface DeliveryPersonDTO {
  id: string;
  sellerId: string;
  name: string;
  phone: string;
  phoneDisplay: string;
  notes: string | null;
  isActive: boolean;
  dispatchCount: number;
  lastDispatchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Delivery Person DTO
 */
export interface CreateDeliveryPersonDTO {
  sellerId: string;
  name: string;
  phone: string;
  notes?: string;
}

/**
 * Update Delivery Person DTO
 */
export interface UpdateDeliveryPersonDTO {
  id: string;
  sellerId: string;
  name?: string;
  phone?: string;
  notes?: string;
  isActive?: boolean;
}

/**
 * Delivery Person List Query DTO
 */
export interface DeliveryPersonListQueryDTO {
  sellerId: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Delivery Person List Response DTO
 */
export interface DeliveryPersonListResponseDTO {
  deliveryPersons: DeliveryPersonDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================
// Order Dispatch DTOs
// ============================================================

/**
 * Status History Entry DTO
 */
export interface StatusHistoryEntryDTO {
  status: DispatchStatus;
  timestamp: string;
  note?: string;
}

/**
 * Order Dispatch Response DTO
 */
export interface OrderDispatchDTO {
  id: string;
  orderId: string;
  sellerId: string;
  dispatchType: DispatchType;

  // Manual dispatch
  deliveryPersonId: string | null;
  deliveryPersonName: string | null;
  deliveryPersonPhone: string | null;
  deliveryPersonPhoneDisplay: string | null;

  // API provider
  providerId: string | null;
  externalTrackingId: string | null;
  externalStatus: string | null;

  // Pricing
  codAmount: {
    amount: number;
    currency: string;
  } | null;

  // Status
  status: DispatchStatus;
  statusHistory: StatusHistoryEntryDTO[];
  whatsappSentAt: string | null;
  notes: string | null;

  // Computed
  isPending: boolean;
  isCompleted: boolean;

  createdAt: string;
  updatedAt: string;
}

/**
 * Create Manual Dispatch DTO
 */
export interface CreateManualDispatchDTO {
  orderId: string;
  sellerId: string;
  deliveryPersonId: string;
  codAmount?: number;
  notes?: string;
}

/**
 * Update Dispatch Status DTO
 */
export interface UpdateDispatchStatusDTO {
  dispatchId: string;
  sellerId: string;
  status: DispatchStatus;
  note?: string;
}

/**
 * Order Dispatch List Query DTO
 */
export interface OrderDispatchListQueryDTO {
  sellerId: string;
  orderId?: string;
  status?: DispatchStatus;
  limit?: number;
  offset?: number;
}

/**
 * Order Dispatch List Response DTO
 */
export interface OrderDispatchListResponseDTO {
  dispatches: OrderDispatchDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================
// WhatsApp Message DTOs
// ============================================================

/**
 * WhatsApp Dispatch Message Input
 * Used to generate the WhatsApp message for dispatch
 */
export interface WhatsAppDispatchMessageInput {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    city: string;
    neighborhood?: string;
    buildingName?: string;
    floor?: string;
    apartmentNumber?: string;
    deliveryInstructions?: string;
    locationUrl?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
  items: {
    title: string;
    quantity: number;
    selectedVariant?: string;
  }[];
  codAmount?: number;
  currency?: string;
  notes?: string;
}

/**
 * WhatsApp Dispatch Message Response
 */
export interface WhatsAppDispatchMessageDTO {
  message: string;
  whatsappUrl: string;
  deliveryPersonPhone: string;
}
