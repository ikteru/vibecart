/**
 * Check Instagram Health Use Case
 *
 * Returns the health status of a seller's Instagram connection.
 * Optionally validates the token with a lightweight API call.
 */

import { InstagramGraphService } from '@/infrastructure/external-services/InstagramGraphService';
import { InstagramApiError } from '@/domain/value-objects/InstagramApiError';
import { TokenDecryptionError, decryptToken } from '@/infrastructure/utils/encryption';
import type { InstagramTokenRepository } from '@/domain/repositories/InstagramTokenRepository';

type HealthStatus = 'healthy' | 'expiring' | 'expired' | 'revoked' | 'refresh_failed' | 'disconnected';

interface CheckInstagramHealthInput {
  sellerId: string;
  validate?: boolean; // Make a lightweight API call to verify
}

interface CheckInstagramHealthOutput {
  status: HealthStatus;
  daysRemaining?: number;
  needsReconnect: boolean;
  lastError?: string;
  refreshFailureCount?: number;
  username?: string;
}

export class CheckInstagramHealth {
  private instagramService: InstagramGraphService;
  private instagramTokenRepository: InstagramTokenRepository;

  constructor(instagramTokenRepository: InstagramTokenRepository) {
    this.instagramService = new InstagramGraphService();
    this.instagramTokenRepository = instagramTokenRepository;
  }

  async execute(input: CheckInstagramHealthInput): Promise<CheckInstagramHealthOutput> {
    const token = await this.instagramTokenRepository.findBySellerId(input.sellerId);

    if (!token) {
      return { status: 'disconnected', needsReconnect: true };
    }

    // Check expiration
    const now = new Date();
    const msRemaining = token.expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60 * 24)));

    // If already marked as revoked/expired
    if (token.status === 'revoked') {
      return {
        status: 'revoked',
        daysRemaining,
        needsReconnect: true,
        lastError: token.lastError ?? undefined,
        username: token.instagramUsername,
      };
    }

    if (token.isExpired()) {
      return {
        status: 'expired',
        daysRemaining: 0,
        needsReconnect: true,
        username: token.instagramUsername,
      };
    }

    if (token.status === 'refresh_failed') {
      return {
        status: 'refresh_failed',
        daysRemaining,
        needsReconnect: token.refreshFailureCount >= 3,
        lastError: token.lastError ?? undefined,
        refreshFailureCount: token.refreshFailureCount,
        username: token.instagramUsername,
      };
    }

    // Optional: validate with a lightweight API call
    if (input.validate) {
      try {
        const accessToken = decryptToken(token.accessTokenEncrypted);
        await this.instagramService.getUserProfile(accessToken);

        // Successful validation — mark as active if it wasn't
        if (token.status !== 'active') {
          token.markAsActive();
          await this.instagramTokenRepository.save(token);
        }
      } catch (error) {
        // Handle decryption failures — token data is corrupted or key was rotated
        if (error instanceof TokenDecryptionError) {
          token.markAsRevoked('Token decryption failed — reconnection required');
          await this.instagramTokenRepository.save(token);
          return {
            status: 'revoked',
            daysRemaining,
            needsReconnect: true,
            lastError: 'Token decryption failed',
            username: token.instagramUsername,
          };
        }

        if (error instanceof InstagramApiError && error.requiresReconnect) {
          token.markAsRevoked(error.message);
          await this.instagramTokenRepository.save(token);
          return {
            status: 'revoked',
            daysRemaining,
            needsReconnect: true,
            lastError: error.message,
            username: token.instagramUsername,
          };
        }
        // Non-auth errors (rate limit, transient) — don't change status
      }
    }

    // Token is expiring within 7 days — write status to DB
    if (token.expiresWithinDays(7)) {
      if (token.status !== 'expiring') {
        token.markAsExpiring();
        await this.instagramTokenRepository.save(token);
      }
      return {
        status: 'expiring',
        daysRemaining,
        needsReconnect: false,
        username: token.instagramUsername,
      };
    }

    return {
      status: 'healthy',
      daysRemaining,
      needsReconnect: false,
      username: token.instagramUsername,
    };
  }
}
