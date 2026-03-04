import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';
import { SupabaseInstagramTokenRepository } from '@/infrastructure/persistence/supabase';
import { RefreshExpiringTokens } from '@/application/use-cases/instagram';

/**
 * GET /api/cron/refresh-instagram-tokens
 *
 * Daily cron job that refreshes Instagram tokens expiring within 7 days.
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();
    const instagramTokenRepo = new SupabaseInstagramTokenRepository(adminClient);

    const useCase = new RefreshExpiringTokens(instagramTokenRepo);
    const result = await useCase.execute();

    console.log(
      `[cron] Instagram token refresh: ${result.refreshed} refreshed, ${result.failed} failed, ${result.revoked} revoked, ${result.skipped} skipped out of ${result.total}`
    );

    return NextResponse.json({
      success: true,
      summary: {
        total: result.total,
        refreshed: result.refreshed,
        skipped: result.skipped,
        failed: result.failed,
        revoked: result.revoked,
      },
    });
  } catch (error) {
    console.error('GET /api/cron/refresh-instagram-tokens error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
