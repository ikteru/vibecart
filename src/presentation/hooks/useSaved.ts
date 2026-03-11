'use client';

import { useCallback } from 'react';
import { useLocalStorage, shopKey } from './useLocalStorage';

export interface SavedProduct {
  productId: string;
  title: string;
  price: number;
  currency: string;
  discountPrice?: number;
  thumbnail?: string;
  savedAt: string; // ISO date
}

export function useSaved(shopHandle: string) {
  const [saved, setSaved] = useLocalStorage<SavedProduct[]>(
    shopKey(shopHandle, 'saved'),
    []
  );

  const toggleSaved = useCallback(
    (product: Omit<SavedProduct, 'savedAt'>) => {
      setSaved((prev) => {
        const exists = prev.find((p) => p.productId === product.productId);
        if (exists) {
          return prev.filter((p) => p.productId !== product.productId);
        }
        return [...prev, { ...product, savedAt: new Date().toISOString() }];
      });
    },
    [setSaved]
  );

  const isSaved = useCallback(
    (productId: string) => saved.some((p) => p.productId === productId),
    [saved]
  );

  const removeSaved = useCallback(
    (productId: string) => {
      setSaved((prev) => prev.filter((p) => p.productId !== productId));
    },
    [setSaved]
  );

  return { saved, toggleSaved, isSaved, removeSaved };
}
