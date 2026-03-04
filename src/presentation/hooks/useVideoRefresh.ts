'use client';

/**
 * useVideoRefresh Hook
 *
 * Deduplicates concurrent refresh requests for the same product.
 * Implements a 30-second cooldown per product and session-based backoff.
 */

// Module-level deduplication map
const inFlightRequests = new Map<string, Promise<string | null>>();
const lastRefreshTime = new Map<string, number>();

const COOLDOWN_MS = 30_000; // 30 seconds between refreshes
const MIN_BACKOFF_MS = 5 * 60_000; // 5 minutes minimum after a failure

interface RefreshResult {
  videoUrl: string | null;
  error?: string;
  needsReconnect?: boolean;
  errorType?: string;
}

async function doRefresh(productId: string): Promise<RefreshResult> {
  const response = await fetch(`/api/products/${productId}/refresh-video`, {
    method: 'POST',
  });

  const data = await response.json();

  if (data.success && data.videoUrl) {
    return { videoUrl: data.videoUrl };
  }

  return {
    videoUrl: null,
    error: data.error,
    needsReconnect: data.needsReconnect,
    errorType: data.errorType,
  };
}

export function useVideoRefresh() {
  const refreshVideo = async (productId: string): Promise<RefreshResult> => {
    // Check cooldown
    const lastTime = lastRefreshTime.get(productId);
    if (lastTime && Date.now() - lastTime < COOLDOWN_MS) {
      return { videoUrl: null, error: 'cooldown' };
    }

    // Check session-based backoff
    const backoffKey = `video-backoff-${productId}`;
    const backoffUntil = sessionStorage.getItem(backoffKey);
    if (backoffUntil && Date.now() < parseInt(backoffUntil, 10)) {
      return { videoUrl: null, error: 'backoff' };
    }

    // Deduplicate: if a request is already in flight, join it
    const existing = inFlightRequests.get(productId);
    if (existing) {
      const url = await existing;
      return { videoUrl: url };
    }

    // Start new request
    const promise = doRefresh(productId).then((result) => {
      lastRefreshTime.set(productId, Date.now());
      inFlightRequests.delete(productId);

      // On failure, set backoff
      if (!result.videoUrl && result.error !== 'cooldown') {
        sessionStorage.setItem(
          backoffKey,
          String(Date.now() + MIN_BACKOFF_MS)
        );
      }

      return result.videoUrl;
    }).catch(() => {
      inFlightRequests.delete(productId);
      lastRefreshTime.set(productId, Date.now());
      return null;
    });

    inFlightRequests.set(productId, promise);

    const url = await promise;
    return { videoUrl: url };
  };

  return { refreshVideo };
}
