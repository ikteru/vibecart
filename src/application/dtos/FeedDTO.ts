/**
 * DTOs for the public product feed (aggregating products across all sellers)
 */

interface MoneyValue {
  amount: number;
  currency: string;
}

export interface FeedProductDTO {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: MoneyValue;
  discountPrice?: MoneyValue;
  promotionLabel?: string;
  stock: number;
  videoUrl?: string;
  category: string;
  variants?: string[];
  isActive: boolean;
  createdAt: string;
  // Computed
  hasDiscount: boolean;
  discountPercentage: number | null;
  effectivePrice: MoneyValue;
  isInStock: boolean;
  hasLowStock: boolean;
  // Seller info
  sellerName: string;
  sellerHandle: string;
}

export interface FeedQueryDTO {
  limit: number;
  cursor?: string;
}

export interface FeedResponseDTO {
  products: FeedProductDTO[];
  nextCursor: string | null;
}
