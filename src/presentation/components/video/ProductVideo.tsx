'use client';

import React, { useRef, useState, useCallback, useEffect, forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { VideoOff, RefreshCw, Loader2 } from 'lucide-react';
import { useVideoRefresh } from '@/presentation/hooks/useVideoRefresh';

interface ProductVideoProps {
  productId: string;
  src: string | null | undefined;
  className?: string;
  loop?: boolean;
  playsInline?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  isActive?: boolean;
}

const MAX_RETRIES = 2;

/**
 * ProductVideo Component
 *
 * Wraps a <video> element with auto-refresh logic for expired Instagram CDN URLs.
 * Shows visible fallback UI with retry button on failure instead of blank space.
 */
export const ProductVideo = forwardRef<HTMLVideoElement, ProductVideoProps>(
  function ProductVideo(
    { productId, src, className, loop, playsInline, muted, autoPlay, isActive },
    ref
  ) {
    const t = useTranslations('common.video');
    const internalRef = useRef<HTMLVideoElement>(null);
    const [videoSrc, setVideoSrc] = useState(src);
    const [retryCount, setRetryCount] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasFailed, setHasFailed] = useState(false);
    const { refreshVideo } = useVideoRefresh();

    // Merge refs
    const setRefs = useCallback(
      (node: HTMLVideoElement | null) => {
        (internalRef as React.MutableRefObject<HTMLVideoElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLVideoElement | null>).current = node;
        }
      },
      [ref]
    );

    // Sync src from props
    useEffect(() => {
      setVideoSrc(src);
      setRetryCount(0);
      setHasFailed(false);
      setIsRefreshing(false);
    }, [src]);

    // Auto-play/pause based on isActive
    useEffect(() => {
      if (internalRef.current && isActive !== undefined) {
        if (isActive) {
          internalRef.current.play().catch(() => {});
        } else {
          internalRef.current.pause();
        }
      }
    }, [isActive]);

    const attemptRefresh = useCallback(async () => {
      if (retryCount >= MAX_RETRIES || isRefreshing) return;

      setIsRefreshing(true);
      try {
        const result = await refreshVideo(productId);
        if (result.videoUrl) {
          setVideoSrc(result.videoUrl);
          setHasFailed(false);
          setRetryCount((c) => c + 1);
        } else {
          setHasFailed(true);
        }
      } catch {
        setHasFailed(true);
      } finally {
        setIsRefreshing(false);
      }
    }, [productId, retryCount, isRefreshing, refreshVideo]);

    const handleError = useCallback(() => {
      // Auto-refresh on first error
      if (retryCount === 0) {
        attemptRefresh();
      } else {
        setHasFailed(true);
      }
    }, [retryCount, attemptRefresh]);

    const handleManualRetry = useCallback(() => {
      if (retryCount < MAX_RETRIES) {
        setHasFailed(false);
        attemptRefresh();
      }
    }, [retryCount, attemptRefresh]);

    // No src at all — show placeholder
    if (!videoSrc && !isRefreshing && !hasFailed) {
      return null;
    }

    // Failed state — show fallback UI
    if (hasFailed && !isRefreshing) {
      return (
        <div className={`relative flex items-center justify-center bg-zinc-900 ${className || ''}`}>
          <div className="flex flex-col items-center gap-2 text-center p-4">
            <VideoOff size={32} className="text-zinc-600" />
            <p className="text-xs text-zinc-500">{t('unavailable')}</p>
            {retryCount < MAX_RETRIES && (
              <button
                onClick={handleManualRetry}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
              >
                <RefreshCw size={12} />
                {t('retry')}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className || ''}`}>
        {videoSrc && (
          <video
            ref={setRefs}
            src={videoSrc}
            className="w-full h-full object-cover"
            loop={loop}
            playsInline={playsInline}
            muted={muted}
            autoPlay={autoPlay}
            onError={handleError}
          />
        )}

        {/* Refreshing overlay */}
        {isRefreshing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-white animate-spin" />
              <p className="text-xs text-zinc-300">{t('refreshing')}</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);
