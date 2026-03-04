/**
 * Refresh Expiring Tokens Use Case
 *
 * Batch-refreshes Instagram tokens that are expiring within 7 days.
 * Intended to be called by a daily cron job.
 * Implements exponential backoff: skips tokens with recent failures.
 */

import { InstagramGraphService } from '@/infrastructure/external-services/InstagramGraphService';
import { InstagramApiError } from '@/domain/value-objects/InstagramApiError';
import { decryptToken, encryptToken } from '@/infrastructure/utils/encryption';
import type { InstagramTokenRepository } from '@/domain/repositories/InstagramTokenRepository';

interface RefreshResult {
  sellerId: string;
  status: 'refreshed' | 'skipped' | 'failed' | 'revoked';
  error?: string;
}

interface RefreshExpiringTokensOutput {
  total: number;
  refreshed: number;
  skipped: number;
  failed: number;
  revoked: number;
  results: RefreshResult[];
}

export class RefreshExpiringTokens {
  private instagramService: InstagramGraphService;
  private instagramTokenRepository: InstagramTokenRepository;

  constructor(instagramTokenRepository: InstagramTokenRepository) {
    this.instagramService = new InstagramGraphService();
    this.instagramTokenRepository = instagramTokenRepository;
  }

  async execute(): Promise<RefreshExpiringTokensOutput> {
    // Find tokens expiring within 7 days
    const tokens = await this.instagramTokenRepository.findExpiringTokens(7);

    const results: RefreshResult[] = [];

    for (const token of tokens) {
      // Exponential backoff: skip tokens with recent failures
      // Wait (1 day * failureCount) before retrying
      if (token.refreshFailureCount > 0 && token.updatedAt) {
        const daysSinceLastAttempt =
          (Date.now() - token.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastAttempt < token.refreshFailureCount) {
          results.push({
            sellerId: token.sellerId,
            status: 'skipped',
            error: `Backoff: ${token.refreshFailureCount} failures, retry in ${Math.ceil(token.refreshFailureCount - daysSinceLastAttempt)} day(s)`,
          });
          continue;
        }
      }

      try {
        const accessToken = decryptToken(token.accessTokenEncrypted);
        const refreshed = await this.instagramService.refreshToken(accessToken);

        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshed.expires_in);

        token.updateToken(encryptToken(refreshed.access_token), newExpiresAt);
        await this.instagramTokenRepository.save(token);

        results.push({ sellerId: token.sellerId, status: 'refreshed' });
      } catch (error) {
        if (error instanceof InstagramApiError && error.requiresReconnect) {
          token.markAsRevoked(error.message);
          await this.instagramTokenRepository.save(token);
          results.push({
            sellerId: token.sellerId,
            status: 'revoked',
            error: error.message,
          });
        } else {
          token.markRefreshFailed(
            error instanceof Error ? error.message : 'Unknown error'
          );
          await this.instagramTokenRepository.save(token);
          results.push({
            sellerId: token.sellerId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return {
      total: tokens.length,
      refreshed: results.filter((r) => r.status === 'refreshed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      failed: results.filter((r) => r.status === 'failed').length,
      revoked: results.filter((r) => r.status === 'revoked').length,
      results,
    };
  }
}
