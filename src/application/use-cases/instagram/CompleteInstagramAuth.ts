/**
 * Complete Instagram Auth Use Case
 *
 * Handles the OAuth callback: exchanges code for tokens,
 * stores encrypted token, and updates seller config.
 * Uses compensation pattern for atomic token+seller save.
 */

import { InstagramGraphService } from '@/infrastructure/external-services/InstagramGraphService';
import { InstagramToken } from '@/domain/entities/InstagramToken';
import { InstagramApiError } from '@/domain/value-objects/InstagramApiError';
import { INSTAGRAM_ERROR_CODES, mapInstagramErrorToCode } from '@/domain/value-objects/InstagramErrorCode';
import { encryptToken } from '@/infrastructure/utils/encryption';
import { logger } from '@/infrastructure/utils/logger';
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
        error: 'Invalid state parameter',
        errorCode: INSTAGRAM_ERROR_CODES.INVALID_SESSION,
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
        error: 'Invalid state format',
        errorCode: INSTAGRAM_ERROR_CODES.INVALID_SESSION,
      };
    }

    // 3. Check state timestamp (expire after 10 minutes)
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - stateData.timestamp > TEN_MINUTES) {
      return {
        success: false,
        error: 'Authorization expired',
        errorCode: INSTAGRAM_ERROR_CODES.AUTH_EXPIRED,
      };
    }

    // 4. Verify seller exists
    const seller = await this.sellerRepository.findById(stateData.sellerId);
    if (!seller) {
      return {
        success: false,
        error: 'Seller not found',
        errorCode: INSTAGRAM_ERROR_CODES.UNEXPECTED,
      };
    }

    try {
      // 5. Exchange code for short-lived token
      const shortLivedToken = await this.instagramService.exchangeCodeForToken(input.code);

      // 6. Exchange for long-lived token (60 days)
      let accessToken = shortLivedToken.access_token;
      let tokenExpiresIn = 3600; // short-lived: ~1 hour
      try {
        const longLivedToken = await this.instagramService.getLongLivedToken(
          shortLivedToken.access_token
        );
        accessToken = longLivedToken.access_token;
        tokenExpiresIn = longLivedToken.expires_in;
      } catch (tokenError) {
        logger.warn('Long-lived token exchange failed, using short-lived token', {
          context: 'instagram',
          error: tokenError instanceof Error ? tokenError.message : 'Unknown',
        });
      }

      // 7. Get user profile
      const profile = await this.instagramService.getUserProfile(accessToken);

      // 8. Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenExpiresIn);

      // 9. Encrypt and store token
      const encryptedToken = encryptToken(accessToken);

      const instagramToken = InstagramToken.create({
        sellerId: seller.id,
        instagramUserId: profile.id,
        instagramUsername: profile.username,
        accessTokenEncrypted: encryptedToken,
        tokenType: 'bearer',
        expiresAt,
        scopes: ['instagram_business_basic', 'instagram_business_content_publish'],
      });

      await this.instagramTokenRepository.save(instagramToken);

      // 10. Update seller's InstagramConfig (with compensation on failure)
      try {
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
      } catch (sellerSaveError) {
        // Compensation: delete orphaned token if seller save fails
        logger.error('Seller save failed, compensating by removing token', {
          context: 'instagram',
          sellerId: seller.id,
          error: sellerSaveError instanceof Error ? sellerSaveError.message : 'Unknown',
        });
        try {
          await this.instagramTokenRepository.deleteBySellerId(seller.id);
        } catch (deleteError) {
          logger.error('Failed to delete orphaned token during compensation', {
            context: 'instagram',
            sellerId: seller.id,
            error: deleteError instanceof Error ? deleteError.message : 'Unknown',
          });
        }
        return {
          success: false,
          error: 'Failed to save connection',
          errorCode: INSTAGRAM_ERROR_CODES.CONNECTION_FAILED,
        };
      }

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
      logger.error('Instagram auth error', {
        context: 'instagram',
        error: error instanceof Error ? error.message : 'Unknown',
      });

      if (error instanceof InstagramApiError) {
        return {
          success: false,
          error: error.message,
          errorCode: mapInstagramErrorToCode(error),
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect Instagram',
        errorCode: INSTAGRAM_ERROR_CODES.UNEXPECTED,
      };
    }
  }
}
