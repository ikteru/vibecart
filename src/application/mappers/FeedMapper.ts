/**
 * FeedMapper - Maps feed product rows to FeedProductDTO
 */

import type { FeedProductRow } from '@/domain/repositories/FeedRepository';
import type { FeedProductDTO } from '@/application/dtos/FeedDTO';

export const FeedMapper = {
  toDTO(row: FeedProductRow): FeedProductDTO {
    // DB stores amounts in centimes — convert to major units for display
    const priceAmount = row.price_amount / 100;
    const discountAmount = row.discount_price_amount != null ? row.discount_price_amount / 100 : null;
    const hasDiscount = discountAmount != null && discountAmount > 0;
    const effectiveAmount = hasDiscount ? discountAmount! : priceAmount;

    let discountPercentage: number | null = null;
    if (hasDiscount) {
      discountPercentage = Math.round(
        ((priceAmount - discountAmount!) / priceAmount) * 100
      );
    }

    return {
      id: row.id,
      sellerId: row.seller_id,
      title: row.title,
      description: row.description,
      price: { amount: priceAmount, currency: row.price_currency },
      discountPrice: hasDiscount
        ? { amount: discountAmount!, currency: row.discount_price_currency || row.price_currency }
        : undefined,
      promotionLabel: row.promotion_label,
      stock: row.stock,
      videoUrl: row.video_url,
      category: row.category,
      variants: row.variants,
      isActive: row.is_active,
      createdAt: row.created_at,
      hasDiscount,
      discountPercentage,
      effectivePrice: { amount: effectiveAmount, currency: row.price_currency },
      isInStock: row.stock > 0,
      hasLowStock: row.stock > 0 && row.stock < 10,
      sellerName: row.shop_name,
      sellerHandle: row.handle,
    };
  },

  toDTOList(rows: FeedProductRow[]): FeedProductDTO[] {
    return rows.map((row) => FeedMapper.toDTO(row));
  },
};
