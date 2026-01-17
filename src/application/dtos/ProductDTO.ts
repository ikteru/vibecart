import type { ProductCategoryType } from '@/domain/value-objects/ProductCategory';

/**
 * Product Response DTO
 *
 * Serializable representation of a Product for API responses.
 */
export interface ProductResponseDTO {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  discountPrice: {
    amount: number;
    currency: string;
  } | null;
  promotionLabel: string | null;
  stock: number;
  videoUrl: string | null;
  instagramMediaId: string | null;
  category: ProductCategoryType;
  variants: string[];
  isActive: boolean;
  hasDiscount: boolean;
  discountPercentage: number;
  effectivePrice: {
    amount: number;
    currency: string;
  };
  isInStock: boolean;
  hasLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Product DTO
 *
 * Input for creating a new product.
 */
export interface CreateProductDTO {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  promotionLabel?: string;
  stock: number;
  videoUrl?: string;
  instagramMediaId?: string;
  category: ProductCategoryType;
  variants?: string[];
}

/**
 * Update Product DTO
 *
 * Input for updating an existing product.
 */
export interface UpdateProductDTO {
  title?: string;
  description?: string;
  price?: number;
  discountPrice?: number | null;
  promotionLabel?: string | null;
  stock?: number;
  videoUrl?: string;
  instagramMediaId?: string;
  category?: ProductCategoryType;
  variants?: string[];
  isActive?: boolean;
}

/**
 * Product List Query DTO
 *
 * Query parameters for fetching product lists.
 */
export interface ProductListQueryDTO {
  sellerId: string;
  category?: ProductCategoryType;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Product List Response DTO
 *
 * Response for product list queries with pagination info.
 */
export interface ProductListResponseDTO {
  products: ProductResponseDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
