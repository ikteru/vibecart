import { SellerRepository } from '@/domain/repositories/SellerRepository';
import { SellerMapper } from '@/application/mappers/SellerMapper';
import type { SellerResponseDTO } from '@/application/dtos/SellerDTO';

/**
 * GetSellerProfile Use Case Input
 */
export interface GetSellerProfileInput {
  userId: string;
  locale?: string;
}

/**
 * GetSellerProfile Use Case Output
 */
export interface GetSellerProfileOutput {
  seller: SellerResponseDTO | null;
}

/**
 * GetSellerProfile Use Case
 *
 * Retrieves full seller profile for authenticated user.
 * Used for the seller dashboard.
 */
export class GetSellerProfile {
  constructor(private sellerRepository: SellerRepository) {}

  async execute(input: GetSellerProfileInput): Promise<GetSellerProfileOutput> {
    const { userId, locale = 'ar-MA' } = input;

    const seller = await this.sellerRepository.findByUserId(userId);

    if (!seller) {
      return { seller: null };
    }

    return {
      seller: SellerMapper.toDTO(seller, locale),
    };
  }
}
