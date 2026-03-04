import type { ShopConfig } from '@/domain/entities/Seller';

/**
 * Seller Response DTO
 *
 * Serializable representation of a Seller for API responses.
 */
export interface SellerResponseDTO {
  id: string;
  userId: string;
  shopName: string;
  handle: string;
  whatsappNumber: string | null;
  whatsappDisplayNumber: string | null;
  whatsappUrl: string | null;
  shopConfig: ShopConfig;
  shopPath: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public Seller DTO
 *
 * Limited seller info for public shop pages.
 */
export interface PublicSellerDTO {
  id: string;
  shopName: string;
  handle: string;
  whatsappDisplayNumber: string | null;
  whatsappUrl: string | null;
  shopConfig: ShopConfig;
  shopPath: string;
}

/**
 * Create Seller DTO
 *
 * Input for creating a new seller.
 */
export interface CreateSellerDTO {
  userId: string;
  shopName: string;
  handle: string;
  whatsappNumber?: string;
  shopConfig?: ShopConfig;
}

/**
 * Update Seller DTO
 *
 * Input for updating seller profile.
 */
export interface UpdateSellerDTO {
  shopName?: string;
  whatsappNumber?: string;
  shopConfig?: Partial<ShopConfig>;
}

/**
 * Update Handle DTO
 *
 * Input for changing the shop handle.
 */
export interface UpdateHandleDTO {
  newHandle: string;
}
