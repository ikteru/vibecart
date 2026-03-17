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
  const [hasMore, setHasMore] = useState(initialCursor !== null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingRef.current || !cursor) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}&limit=10`);
      const data = await res.json();

      if (data.success && data.products) {
        setProducts((prev) => [...prev, ...data.products]);
        setCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [cursor, hasMore]);

  return { products, isLoading, hasMore, loadMore };
}
