import { Seller } from '@/domain/entities/Seller';
import type { SellerResponseDTO, PublicSellerDTO } from '../dtos/SellerDTO';

/**
 * SellerMapper
 *
 * Converts between Seller domain entity and DTOs.
 */
export const SellerMapper = {
  /**
   * Convert a Seller entity to a full response DTO
   */
  toDTO(seller: Seller, locale: string = 'ar-MA'): SellerResponseDTO {
    return {
      id: seller.id,
      userId: seller.userId,
      shopName: seller.shopName,
      handle: seller.handle,
      whatsappNumber: seller.whatsappNumber?.value ?? null,
      whatsappDisplayNumber: seller.whatsappNumber?.toDisplayFormat() ?? null,
      whatsappUrl: seller.getWhatsAppUrl(),
      shopConfig: seller.shopConfig,
      shopPath: seller.getShopPath(locale),
      createdAt: seller.createdAt.toISOString(),
      updatedAt: seller.updatedAt.toISOString(),
    };
  },

  /**
   * Convert a Seller entity to a public DTO (limited info)
   */
  toPublicDTO(seller: Seller, locale: string = 'ar-MA'): PublicSellerDTO {
    return {
      id: seller.id,
      shopName: seller.shopName,
      handle: seller.handle,
      whatsappDisplayNumber: seller.whatsappNumber?.toDisplayFormat() ?? null,
      whatsappUrl: seller.getWhatsAppUrl(),
      shopConfig: seller.shopConfig,
      shopPath: seller.getShopPath(locale),
    };
  },

  /**
   * Convert multiple Seller entities to DTOs
   */
  toDTOList(sellers: Seller[], locale: string = 'ar-MA'): SellerResponseDTO[] {
    return sellers.map((seller) => SellerMapper.toDTO(seller, locale));
  },

  /**
   * Convert multiple Seller entities to public DTOs
   */
  toPublicDTOList(sellers: Seller[], locale: string = 'ar-MA'): PublicSellerDTO[] {
    return sellers.map((seller) => SellerMapper.toPublicDTO(seller, locale));
  },
};
