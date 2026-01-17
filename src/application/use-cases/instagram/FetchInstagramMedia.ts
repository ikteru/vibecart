/**
 * Fetch Instagram Media Use Case
 *
 * Fetches media from a connected Instagram account.
 * Handles token refresh if needed.
 */

import { InstagramGraphService } from '@/infrastructure/external-services/InstagramGraphService';
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

      // 2. Check if token is expired
      if (token.isExpired()) {
        return {
          success: false,
          error: 'Instagram token expired. Please reconnect.',
          needsReconnect: true,
        };
      }

      // 3. Refresh token if expiring within 7 days
      let accessToken = decryptToken(token.accessTokenEncrypted);

      if (token.expiresWithinDays(7)) {
        try {
          const refreshed = await this.instagramService.refreshToken(accessToken);
          accessToken = refreshed.access_token;

          // Update stored token
          const newExpiresAt = new Date();
          newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshed.expires_in);

          token.updateToken(
            encryptToken(accessToken),
            newExpiresAt
          );

          await this.instagramTokenRepository.save(token);
        } catch (refreshError) {
          console.warn('Token refresh failed, using existing token:', refreshError);
          // Continue with existing token
        }
      }

      // 4. Fetch media from Instagram
      const mediaResponse = await this.instagramService.getUserMedia(accessToken, {
        limit: input.limit || 20,
        after: input.after,
      });

      // 5. Transform to DTOs
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

      // Check if it's an auth error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isAuthError =
        errorMessage.includes('Invalid OAuth') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('token');

      return {
        success: false,
        error: isAuthError ? 'Instagram authorization invalid. Please reconnect.' : errorMessage,
        needsReconnect: isAuthError,
      };
    }
  }
}
