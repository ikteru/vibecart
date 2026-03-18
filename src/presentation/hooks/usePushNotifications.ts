'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Push notification registration hook.
 * Uses Capacitor PushNotifications plugin on native platforms,
 * no-ops on web (web push can be added later via service worker).
 */
export function usePushNotifications() {
  const registeredRef = useRef(false);

  const register = useCallback(async () => {
    if (registeredRef.current) return;

    try {
      // Dynamic import — only loads on native platforms
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const { PushNotifications } = await import('@capacitor/push-notifications');

      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== 'granted') return;

      await PushNotifications.register();

      PushNotifications.addListener('registration', async (token) => {
        registeredRef.current = true;
        // Send token to backend
        try {
          await fetch('/api/devices/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: token.value,
              platform: Capacitor.getPlatform(),
            }),
          });
        } catch {
          // Silent fail — will retry on next app launch
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration failed:', error);
      });
    } catch {
      // Not on native platform or plugin not available
    }
  }, []);

  useEffect(() => {
    register();
  }, [register]);
}
