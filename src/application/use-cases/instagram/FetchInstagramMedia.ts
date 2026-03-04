/**
 * Fetch Instagram Media Use Case
 *
 * Fetches media from a connected Instagram account.
 * Handles token refresh if needed.
 */

import { InstagramGraphService } from '@/infrastructure/external-services/InstagramGraphService';
import { InstagramApiError } from '@/domain/value-objects/InstagramApiError';
import { decryptToken, encryptToken } from '@/infrastructure/utils/encryption';
import type { InstagramTokenRepository } from '@/domain/repositories/InstagramTokenRepository';
import type { InstagramMediaListDTO, InstagramMediaDTO } from '@/application/dtos/InstagramDTO';

interface FetchInstagramMediaInput {
  sellerId: string;
  limit?: number;
  after?: string; // Pagination cursor
}

interface FetchInstagramMediaOutput {
  success: boolean;
  data?: InstagramMediaListDTO;
  error?: string;
  errorType?: string;
  needsReconnect?: boolean;
}

export class FetchInstagramMedia {
  private instagramService: InstagramGraphService;
  private instagramTokenRepository: InstagramTokenRepository;

  constructor(instagramTokenRepository: InstagramTokenRepository) {
    this.instagramService = new InstagramGraphService();
    this.instagramTokenRepository = instagramTokenRepository;
  }

  async execute(input: FetchInstagramMediaInput): Promise<FetchInstagramMediaOutput> {
    try {
      // 1. Get stored token
      const token = await this.instagramTokenRepository.findBySellerId(input.sellerId);

      if (!token) {
        return {
          success: false,
          error: 'Instagram not connected',
          needsReconnect: true,
        };
      }

      // 2. Check if token is usable (active/expiring and not expired)
      if (!token.isUsable()) {
        return {
          success: false,
          error: token.status === 'revoked'
            ? 'Instagram access was revoked. Please reconnect.'
            : 'Instagram token expired. Please reconnect.',
          errorType: token.status,
          needsReconnect: true,
        };
      }

      // 3. Refresh token if expiring within 7 days
      let accessToken = decryptToken(token.accessTokenEncrypted);

      if (token.expiresWithinDays(7)) {
        try {
          const refreshed = await this.instagramService.refreshToken(accessToken);
          accessToken = refreshed.access_token;

          const newExpiresAt = new Date();
          newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshed.expires_in);

          token.updateToken(encryptToken(accessToken), newExpiresAt);
          await this.instagramTokenRepository.save(token);
        } catch (refreshError) {
          // If refresh fails with auth error, mark token accordingly
          if (refreshError instanceof InstagramApiError && refreshError.requiresReconnect) {
            token.markAsRevoked(refreshError.message);
            await this.instagramTokenRepository.save(token);
            return {
              success: false,
              error: 'Instagram access was revoked. Please reconnect.',
              errorType: refreshError.errorType,
              needsReconnect: true,
            };
          }
          // Record refresh failure but continue with existing token
          token.markRefreshFailed(refreshError instanceof Error ? refreshError.message : 'Unknown refresh error');
          await this.instagramTokenRepository.save(token);
          console.warn('Token refresh failed, using existing token:', refreshError);
        }
      }

      // 4. Fetch media from Instagram
      const mediaResponse = await this.instagramService.getUserMedia(accessToken, {
        limit: input.limit || 20,
        after: input.after,
      });

      // 5. Mark token as validated on success
      if (token.status !== 'active') {
        token.markAsActive();
        await this.instagramTokenRepository.save(token);
      }

      // 6. Transform to DTOs
      const media: InstagramMediaDTO[] = mediaResponse.data.map((item) => ({
        id: item.id,
        mediaType: item.media_type,
        mediaUrl: item.media_url,
        thumbnailUrl: item.thumbnail_url,
        permalink: item.permalink,
        caption: item.caption,
        timestamp: item.timestamp,
      }));

      return {
        success: true,
        data: {
          media,
          hasMore: !!mediaResponse.paging?.next,
          cursor: mediaResponse.paging?.cursors?.after,
        },
      };
    } catch (error) {
      console.error('Fetch Instagram media error:', error);

      // Handle typed Instagram API errors
      if (error instanceof InstagramApiError) {
        if (error.requiresReconnect) {
          // Mark token as revoked so we don't keep trying
          try {
            const token = await this.instagramTokenRepository.findBySellerId(input.sellerId);
            if (token) {
              token.markAsRevoked(error.message);
              await this.instagramTokenRepository.save(token);
            }
          } catch (saveError) {
            console.error('Failed to mark token as revoked:', saveError);
          }

          return {
            success: false,
            error: 'Instagram authorization invalid. Please reconnect.',
            errorType: error.errorType,
            needsReconnect: true,
          };
        }

        if (error.isRateLimited) {
          return {
            success: false,
            error: 'Instagram rate limit reached. Please try again later.',
            errorType: error.errorType,
          };
        }

        if (error.isTransient) {
          return {
            success: false,
            error: 'Instagram is temporarily unavailable. Please try again.',
            errorType: error.errorType,
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
