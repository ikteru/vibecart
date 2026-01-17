/**
 * Disconnect Instagram Use Case
 *
 * Removes Instagram connection and deletes stored token.
 */

import type { InstagramTokenRepository } from '@/domain/repositories/InstagramTokenRepository';
import type { SellerRepository } from '@/domain/repositories/SellerRepository';

interface DisconnectInstagramInput {
  sellerId: string;
}

interface DisconnectInstagramOutput {
  success: boolean;
  error?: string;
}

export class DisconnectInstagram {
  private instagramTokenRepository: InstagramTokenRepository;
  private sellerRepository: SellerRepository;

  constructor(
    instagramTokenRepository: InstagramTokenRepository,
    sellerRepository: SellerRepository
  ) {
    this.instagramTokenRepository = instagramTokenRepository;
    this.sellerRepository = sellerRepository;
  }

  async execute(input: DisconnectInstagramInput): Promise<DisconnectInstagramOutput> {
    try {
      // 1. Find seller
      const seller = await this.sellerRepository.findById(input.sellerId);
      if (!seller) {
        return {
          success: false,
          error: 'Seller not found',
        };
      }

      // 2. Delete stored token
      await this.instagramTokenRepository.deleteBySellerId(input.sellerId);

      // 3. Update seller's InstagramConfig
      seller.updateShopConfig({
        instagram: {
          isConnected: false,
          handle: undefined,
          userId: undefined,
          tokenExpiresAt: undefined,
        },
      });

      await this.sellerRepository.save(seller);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Disconnect Instagram error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect Instagram',
      };
    }
  }
}
