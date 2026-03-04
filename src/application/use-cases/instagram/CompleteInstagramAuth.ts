/**
 * Complete Instagram Auth Use Case
 *
 * Handles the OAuth callback: exchanges code for tokens,
 * stores encrypted token, and updates seller config.
 */

import { InstagramGraphService } from '@/infrastructure/external-services/InstagramGraphService';
import { InstagramToken } from '@/domain/entities/InstagramToken';
import { InstagramApiError } from '@/domain/value-objects/InstagramApiError';
import { encryptToken } from '@/infrastructure/utils/encryption';
import type { InstagramTokenRepository } from '@/domain/repositories/InstagramTokenRepository';
import type { SellerRepository } from '@/domain/repositories/SellerRepository';
import type { InstagramAuthResultDTO } from '@/application/dtos/InstagramDTO';

interface CompleteInstagramAuthInput {
  code: string;
  state: string;
  expectedState: string; // From cookie/session
}

export class CompleteInstagramAuth {
  private instagramService: InstagramGraphService;
  private instagramTokenRepository: InstagramTokenRepository;
  private sellerRepository: SellerRepository;

  constructor(
    instagramTokenRepository: InstagramTokenRepository,
    sellerRepository: SellerRepository
  ) {
    this.instagramService = new InstagramGraphService();
    this.instagramTokenRepository = instagramTokenRepository;
    this.sellerRepository = sellerRepository;
  }

  async execute(input: CompleteInstagramAuthInput): Promise<InstagramAuthResultDTO> {
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
      // 5. Exchange code for short-lived token
      const shortLivedToken = await this.instagramService.exchangeCodeForToken(input.code);

      // 6. Exchange for long-lived token (60 days)
      const longLivedToken = await this.instagramService.getLongLivedToken(
        shortLivedToken.access_token
      );

      // 7. Get user profile
      const profile = await this.instagramService.getUserProfile(longLivedToken.access_token);

      // 8. Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + longLivedToken.expires_in);

      // 9. Encrypt and store token
      const encryptedToken = encryptToken(longLivedToken.access_token);

      const instagramToken = InstagramToken.create({
        sellerId: seller.id,
        instagramUserId: profile.id,
        instagramUsername: profile.username,
        accessTokenEncrypted: encryptedToken,
        tokenType: longLivedToken.token_type,
        expiresAt,
        scopes: ['instagram_business_basic', 'instagram_business_content_publish'],
      });

      await this.instagramTokenRepository.save(instagramToken);

      // 10. Update seller's InstagramConfig
      seller.updateShopConfig({
        instagram: {
          isConnected: true,
          handle: profile.username,
          userId: profile.id,
          tokenExpiresAt: expiresAt.toISOString(),
          followersCount: profile.followers_count,
          profilePictureUrl: profile.profile_picture_url,
        },
      });

      await this.sellerRepository.save(seller);

      return {
        success: true,
        connection: {
          isConnected: true,
          username: profile.username,
          userId: profile.id,
          expiresAt: expiresAt.toISOString(),
          needsRefresh: false,
        },
      };
    } catch (error) {
      console.error('Instagram auth error:', error);

      if (error instanceof InstagramApiError) {
        return {
          success: false,
          error: error.isRateLimited
            ? 'Rate limited by Instagram. Please try again later.'
            : error.message,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect Instagram',
      };
    }
  }
}
