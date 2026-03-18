'use client';

import { useCallback } from 'react';

interface CameraResult {
  dataUrl: string;
  blob: Blob;
}

/**
 * Camera hook that uses Capacitor Camera on native platforms,
 * falls back to file input on web.
 */
export function useCamera() {
  const takePhoto = useCallback(async (): Promise<CameraResult | null> => {
    try {
      const { Capacitor } = await import('@capacitor/core');

      if (Capacitor.isNativePlatform()) {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const photo = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt, // Let user choose camera or gallery
        });

        if (!photo.dataUrl) return null;

        // Convert data URL to Blob
        const response = await fetch(photo.dataUrl);
        const blob = await response.blob();

        return { dataUrl: photo.dataUrl, blob };
      }
    } catch {
      // Not on native platform or user cancelled
    }

    // Fallback: use file input (works on web)
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            blob: file,
          });
        };
        reader.readAsDataURL(file);
      };

      // User cancelled
      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
  }, []);

  return { takePhoto };
}
