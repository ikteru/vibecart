'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';

/**
 * Non-intrusive banner shown when the device loses connectivity.
 * Uses Capacitor Network plugin on native, navigator.onLine on web.
 */
export function OfflineBanner() {
  const t = useTranslations('app.offline');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Web fallback
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    // Set initial state
    if (!navigator.onLine) setIsOffline(true);

    // Try Capacitor Network plugin for more reliable detection
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { Network } = await import('@capacitor/network');
        const status = await Network.getStatus();
        setIsOffline(!status.connected);

        Network.addListener('networkStatusChange', (s) => {
          setIsOffline(!s.connected);
        });
      } catch {
        // Not on native
      }
    })();

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] safe-area-top">
      <div className="bg-red-500/90 backdrop-blur-sm px-4 py-2 flex items-center justify-center gap-2">
        <WifiOff size={14} className="text-white" />
        <span className="text-white text-xs font-medium">{t('title')}</span>
      </div>
    </div>
  );
}
