import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { SupabaseInstagramTokenRepository } from '@/infrastructure/persistence/supabase';
import { InstagramGraphService } from '@/infrastructure/external-services/InstagramGraphService';
import { InstagramApiError } from '@/domain/value-objects/InstagramApiError';
import { decryptToken, encryptToken } from '@/infrastructure/utils/encryption';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/products/:id/refresh-video
 *
 * Refreshes a product's video URL by fetching a fresh media_url
 * from the Instagram Graph API using the stored instagramMediaId.
 *
 * No auth required (products are public), but rate-limited by middleware.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Use admin client for both reads and writes (no user context)
    const adminClient = createAdminClient();
    const { productRepository } = createRepositories(adminClient);
    const instagramTokenRepo = new SupabaseInstagramTokenRepository(adminClient);

    // 1. Get product
    const product = await productRepository.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // 2. Check if product has an Instagram media reference
    if (!product.instagramMediaId) {
      return NextResponse.json(
        { success: false, error: 'Product has no Instagram media reference' },
        { status: 400 }
      );
    }

    // 3. Get seller's Instagram token
    const token = await instagramTokenRepo.findBySellerId(product.sellerId);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Instagram not connected', errorType: 'disconnected' },
        { status: 503 }
      );
    }

    if (!token.isUsable()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Instagram token unavailable',
          errorType: token.status,
          needsReconnect: true,
        },
        { status: 503 }
      );
    }

    // 4. Refresh the Instagram token if expiring soon
    let accessToken = decryptToken(token.accessTokenEncrypted);
    const instagramService = new InstagramGraphService();

    if (token.expiresWithinDays(7)) {
      try {
        const refreshed = await instagramService.refreshToken(accessToken);
        accessToken = refreshed.access_token;

        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshed.expires_in);
        token.updateToken(encryptToken(accessToken), newExpiresAt);
        await instagramTokenRepo.save(token);
      } catch (refreshError) {
        if (refreshError instanceof InstagramApiError && refreshError.requiresReconnect) {
          token.markAsRevoked(refreshError.message);
          await instagramTokenRepo.save(token);
          return NextResponse.json(
            {
              success: false,
              error: 'Instagram access revoked. Please reconnect.',
              errorType: refreshError.errorType,
              needsReconnect: true,
            },
            { status: 401 }
          );
        }
        // Continue with existing token
      }
    }

    // 5. Fetch fresh media URL from Instagram
    const media = await instagramService.getMedia(
      product.instagramMediaId,
      accessToken
    );

    if (!media.media_url) {
      return NextResponse.json(
        { success: false, error: 'Instagram media URL not available', errorType: 'media_not_found' },
        { status: 404 }
      );
    }

    // 6. Update product's video URL in DB
    product.updateDetails({ videoUrl: media.media_url });
    await productRepository.save(product);

    return NextResponse.json({
      success: true,
      videoUrl: media.media_url,
    });
  } catch (error) {
    console.error('POST /api/products/:id/refresh-video error:', error);

    // Return typed error info for the frontend
    if (error instanceof InstagramApiError) {
      if (error.requiresReconnect) {
        return NextResponse.json(
          {
            success: false,
            error: 'Instagram authorization invalid',
            errorType: error.errorType,
            needsReconnect: true,
          },
          { status: 401 }
        );
      }

      if (error.isRateLimited) {
        return NextResponse.json(
          { success: false, error: 'Rate limited by Instagram', errorType: error.errorType },
          { status: 429 }
        );
      }

      if (error.isMediaNotFound) {
        return NextResponse.json(
          { success: false, error: 'Instagram media not found', errorType: error.errorType },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to refresh video URL' },
      { status: 500 }
    );
  }
}
