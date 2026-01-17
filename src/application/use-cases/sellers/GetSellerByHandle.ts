import { SellerRepository } from '@/domain/repositories/SellerRepository';
import { SellerMapper } from '@/application/mappers/SellerMapper';
import type { PublicSellerDTO } from '@/application/dtos/SellerDTO';

/**
 * GetSellerByHandle Use Case Input
 */
export interface GetSellerByHandleInput {
  handle: string;
  locale?: string;
}

/**
 * GetSellerByHandle Use Case Output
 */
export interface GetSellerByHandleOutput {
  seller: PublicSellerDTO | null;
}

/**
 * GetSellerByHandle Use Case
 *
 * Retrieves public seller info by shop handle.
 * Used for rendering public shop pages.
 */
export class GetSellerByHandle {
  constructor(private sellerRepository: SellerRepository) {}

  async execute(input: GetSellerByHandleInput): Promise<GetSellerByHandleOutput> {
    const { handle, locale = 'ar-MA' } = input;

    const seller = await this.sellerRepository.findByHandle(handle);

    if (!seller) {
      return { seller: null };
    }

    return {
      seller: SellerMapper.toPublicDTO(seller, locale),
    };
  }
}
