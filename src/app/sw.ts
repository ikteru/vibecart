import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, NetworkOnly, Serwist, StaleWhileRevalidate, ExpirationPlugin } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache images from Supabase storage and Instagram CDN
    {
      matcher: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
      handler: new CacheFirst({
        cacheName: 'supabase-images',
        plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 })],
      }),
    },
    {
      matcher: /^https:\/\/.*\.(cdninstagram|fbcdn)\..*/i,
      handler: new CacheFirst({
        cacheName: 'instagram-media',
        plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 })],
      }),
    },
    // Stale-while-revalidate for API feed and product data
    {
      matcher: /\/api\/(feed|products|shop)\/.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'api-data',
        plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 })],
      }),
    },
    // Network-only for auth and webhooks (never cache)
    {
      matcher: /\/api\/(auth|webhooks|cron|devices)\/.*/i,
      handler: new NetworkOnly(),
    },
    // Default caching from Serwist for everything else
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
