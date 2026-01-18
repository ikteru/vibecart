/**
 * Disconnect WhatsApp Use Case
 *
 * Removes WhatsApp Business connection and deletes stored token.
 */

import type { WhatsAppTokenRepository } from '@/domain/repositories/WhatsAppTokenRepository';
import type { SellerRepository } from '@/domain/repositories/SellerRepository';

interface DisconnectWhatsAppInput {
  sellerId: string;
}

interface DisconnectWhatsAppOutput {
  success: boolean;
  error?: string;
}

export class DisconnectWhatsApp {
  private whatsAppTokenRepository: WhatsAppTokenRepository;
  private sellerRepository: SellerRepository;

  constructor(
    whatsAppTokenRepository: WhatsAppTokenRepository,
    sellerRepository: SellerRepository
  ) {
    this.whatsAppTokenRepository = whatsAppTokenRepository;
    this.sellerRepository = sellerRepository;
  }

  async execute(input: DisconnectWhatsAppInput): Promise<DisconnectWhatsAppOutput> {
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
      await this.whatsAppTokenRepository.deleteBySellerId(input.sellerId);

      // 3. Update seller's WhatsApp Business config
      seller.updateShopConfig({
        whatsappBusiness: {
          isConnected: false,
          phoneNumberId: undefined,
          displayPhoneNumber: undefined,
          verifiedName: undefined,
          businessAccountId: undefined,
          businessAccountName: undefined,
          tokenExpiresAt: undefined,
        },
      });

      await this.sellerRepository.save(seller);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Disconnect WhatsApp error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect WhatsApp Business',
      };
    }
  }
}
