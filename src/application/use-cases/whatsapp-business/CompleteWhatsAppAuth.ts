/**
 * Complete WhatsApp Auth Use Case
 *
 * Handles the OAuth callback: exchanges code for tokens,
 * retrieves WhatsApp Business Account info, and stores encrypted token.
 */

import { WhatsAppCloudApiService } from '@/infrastructure/external-services/WhatsAppCloudApiService';
import { WhatsAppBusinessToken } from '@/domain/entities/WhatsAppBusinessToken';
import { encryptWhatsAppToken } from '@/infrastructure/utils/encryption';
import type { WhatsAppTokenRepository } from '@/domain/repositories/WhatsAppTokenRepository';
import type { SellerRepository } from '@/domain/repositories/SellerRepository';

interface CompleteWhatsAppAuthInput {
  code: string;
  state: string;
  expectedState: string; // From cookie/session
}

interface WhatsAppAuthResult {
  success: boolean;
  error?: string;
  connection?: {
    phoneNumberId: string;
    displayPhoneNumber: string;
    businessAccountId: string;
  };
  phoneNumbers?: Array<{
    id: string;
    displayPhoneNumber: string;
    verifiedName: string;
  }>;
  needsPhoneSelection?: boolean;
}

export class CompleteWhatsAppAuth {
  private whatsAppService: WhatsAppCloudApiService;
  private whatsAppTokenRepository: WhatsAppTokenRepository;
  private sellerRepository: SellerRepository;

  constructor(
    whatsAppTokenRepository: WhatsAppTokenRepository,
    sellerRepository: SellerRepository
  ) {
    this.whatsAppService = new WhatsAppCloudApiService();
    this.whatsAppTokenRepository = whatsAppTokenRepository;
    this.sellerRepository = sellerRepository;
  }

  async execute(input: CompleteWhatsAppAuthInput): Promise<WhatsAppAuthResult> {
    // 1. Validate state (CSRF protection)
    if (input.state !== input.expectedState) {
      return {
        success: false,
        error: 'Invalid state parameter. Please try again.',
      };
    }

    // 2. Decode state to get sellerId
    let stateData: { sellerId: string; nonce: string; timestamp: number };
    try {
      const decoded = Buffer.from(input.state, 'base64url').toString('utf8');
      stateData = JSON.parse(decoded);
    } catch {
      return {
        success: false,
        error: 'Invalid state format. Please try again.',
      };
    }

    // 3. Check state timestamp (expire after 10 minutes)
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - stateData.timestamp > TEN_MINUTES) {
      return {
        success: false,
        error: 'Authorization expired. Please try again.',
      };
    }

    // 4. Verify seller exists
    const seller = await this.sellerRepository.findById(stateData.sellerId);
    if (!seller) {
      return {
        success: false,
        error: 'Seller not found.',
      };
    }

    try {
      // 5. Exchange code for access token
      const tokenResponse = await this.whatsAppService.exchangeCodeForToken(input.code);

      // 6. Get user's business accounts
      const businesses = await this.whatsAppService.getBusinessAccounts(tokenResponse.access_token);

      if (businesses.length === 0) {
        return {
          success: false,
          error: 'No Facebook Business accounts found. Please create a Business account first.',
        };
      }

      // 7. Get WhatsApp Business Account from first business
      // In production, you might want to let user select which business
      let wabaId: string | null = null;
      let wabaName: string = '';

      for (const business of businesses) {
        const waba = await this.whatsAppService.getWhatsAppBusinessAccount(
          business.id,
          tokenResponse.access_token
        );
        if (waba) {
          wabaId = waba.id;
          wabaName = waba.name;
          break;
        }
      }

      if (!wabaId) {
        return {
          success: false,
          error: 'No WhatsApp Business Account found. Please set up WhatsApp Business first.',
        };
      }

      // 8. Get phone numbers for the WhatsApp Business Account
      const phoneNumbers = await this.whatsAppService.getPhoneNumbers(
        wabaId,
        tokenResponse.access_token
      );

      if (phoneNumbers.length === 0) {
        return {
          success: false,
          error: 'No phone numbers found in your WhatsApp Business Account.',
        };
      }

      // 9. If multiple phone numbers, let user select (return for selection)
      // For now, we'll use the first one automatically
      const selectedPhone = phoneNumbers[0];

      // 10. Encrypt and store token
      const encryptedToken = encryptWhatsAppToken(tokenResponse.access_token);

      // Calculate expiration (Facebook tokens are typically long-lived, ~60 days)
      let tokenExpiresAt: Date | null = null;
      if (tokenResponse.expires_in) {
        tokenExpiresAt = new Date();
        tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + tokenResponse.expires_in);
      }

      const whatsAppToken = WhatsAppBusinessToken.create({
        sellerId: seller.id,
        phoneNumberId: selectedPhone.id,
        displayPhoneNumber: selectedPhone.display_phone_number,
        businessAccountId: wabaId,
        accessTokenEncrypted: encryptedToken,
        tokenExpiresAt,
      });

      await this.whatsAppTokenRepository.save(whatsAppToken);

      // 11. Update seller's shop config
      seller.updateShopConfig({
        whatsappBusiness: {
          isConnected: true,
          phoneNumberId: selectedPhone.id,
          displayPhoneNumber: selectedPhone.display_phone_number,
          verifiedName: selectedPhone.verified_name,
          businessAccountId: wabaId,
          businessAccountName: wabaName,
          tokenExpiresAt: tokenExpiresAt?.toISOString(),
        },
      });

      await this.sellerRepository.save(seller);

      return {
        success: true,
        connection: {
          phoneNumberId: selectedPhone.id,
          displayPhoneNumber: selectedPhone.display_phone_number,
          businessAccountId: wabaId,
        },
      };
    } catch (error) {
      console.error('WhatsApp auth error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect WhatsApp Business',
      };
    }
  }
}
