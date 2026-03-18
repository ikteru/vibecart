'use client';

import { useState, useCallback, useRef } from 'react';
import type { FeedProductDTO } from '@/application/dtos/FeedDTO';

interface UsePublicFeedOptions {
  initialProducts: FeedProductDTO[];
  initialCursor: string | null;
}

export function usePublicFeed({ initialProducts, initialCursor }: UsePublicFeedOptions) {
  const [products, setProducts] = useState<FeedProductDTO[]>(initialProducts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);
  // Keep initial products for looping
  const initialProductsRef = useRef(initialProducts);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;

    // If no cursor (exhausted API), loop by appending initial products again
    if (!cursor) {
      setProducts((prev) => [...prev, ...initialProductsRef.current]);
      setCursor(initialCursor);
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}&limit=10`);
      const data = await res.json();

      if (data.success && data.products && data.products.length > 0) {
        setProducts((prev) => [...prev, ...data.products]);
        setCursor(data.nextCursor);
      } else {
        // No more from API — next loadMore will loop
        setCursor(null);
      }
    } catch {
      setCursor(null);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [cursor, initialCursor]);

  return { products, isLoading, hasMore: true, loadMore };
}
