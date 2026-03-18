'use client';

import { useEffect } from 'react';
import { usePushNotifications } from '@/presentation/hooks/usePushNotifications';

/**
 * Invisible component that bootstraps native-only features.
 * Runs push notification registration and deep link listener on mount.
 */
export function NativeBootstrap() {
  usePushNotifications();

  // Deep link listener — intercepts URLs opened via App Links / Universal Links
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('appUrlOpen', (event) => {
          // Extract path from the full URL
          try {
            const url = new URL(event.url);
            const path = url.pathname + url.search;
            if (path && path !== '/') {
              window.location.href = path;
            }
          } catch {
            // Invalid URL
          }
        });
        cleanup = () => listener.remove();
      } catch {
        // Not on native
      }
    })();

    return () => cleanup?.();
  }, []);

  return null;
}
