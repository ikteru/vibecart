import { SellerRepository } from '@/domain/repositories/SellerRepository';
import { SellerMapper } from '@/application/mappers/SellerMapper';
import type { UpdateSellerDTO, SellerResponseDTO } from '@/application/dtos/SellerDTO';

/**
 * UpdateSellerProfile Use Case Input
 */
export interface UpdateSellerProfileInput {
  userId: string;
  updates: UpdateSellerDTO;
  locale?: string;
}

/**
 * UpdateSellerProfile Use Case Output
 */
export interface UpdateSellerProfileOutput {
  success: boolean;
  seller?: SellerResponseDTO;
  error?: string;
}

/**
 * UpdateSellerProfile Use Case
 *
 * Updates seller profile and shop configuration.
 */
export class UpdateSellerProfile {
  constructor(private sellerRepository: SellerRepository) {}

  async execute(input: UpdateSellerProfileInput): Promise<UpdateSellerProfileOutput> {
    try {
      const { userId, updates, locale = 'ar-MA' } = input;

      // Find seller by user ID
      const seller = await this.sellerRepository.findByUserId(userId);

      if (!seller) {
        return {
          success: false,
          error: 'Seller not found',
        };
      }

      // Apply profile updates
      if (updates.shopName !== undefined || updates.whatsappNumber !== undefined) {
        seller.updateProfile({
          shopName: updates.shopName,
          whatsappNumber: updates.whatsappNumber,
        });
      }

      // Apply shop config updates
      if (updates.shopConfig !== undefined) {
        seller.updateShopConfig(updates.shopConfig);
      }

      // Save changes
      await this.sellerRepository.save(seller);

      return {
        success: true,
        seller: SellerMapper.toDTO(seller, locale),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  }
}
