import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';
import { SupabaseFeedRepository } from '@/infrastructure/persistence/supabase/SupabaseFeedRepository';
import { GetPublicFeed } from '@/application/use-cases/feed/GetPublicFeed';
import { FeedMapper } from '@/application/mappers/FeedMapper';

/**
 * GET /api/feed?cursor=X&limit=10
 *
 * Public endpoint for the discovery feed. Returns paginated products
 * from all sellers with seller info attached.
 */
export async function GET(request: NextRequest) {
  try {
    const cursor = request.nextUrl.searchParams.get('cursor') || undefined;
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '10', 10) || 10, 1), 20);

    const adminClient = createAdminClient();
    const feedRepository = new SupabaseFeedRepository(adminClient);
    const useCase = new GetPublicFeed(feedRepository);

    const result = await useCase.execute({ limit, cursor });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('GET /api/feed error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
