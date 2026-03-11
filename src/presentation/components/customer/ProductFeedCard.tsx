'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { ProductVideo } from '@/presentation/components/video/ProductVideo';
import type { Product } from '@/domain/entities/Product';

interface ProductFeedCardProps {
  product: Product;
  isSaved: boolean;
  onToggleSaved: () => void;
  onTap: () => void;
}

export function ProductFeedCard({
  product,
  isSaved,
  onToggleSaved,
  onTap,
}: ProductFeedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for auto-play
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hasDiscount = !!product.discountPrice;
  const effectivePrice = product.discountPrice || product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price.amount - effectivePrice.amount) / product.price.amount) * 100
      )
    : 0;

  return (
    <div
      ref={cardRef}
      className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800"
    >
      {/* Video / Image area - 4:5 aspect ratio */}
      <button
        onClick={onTap}
        className="relative w-full aspect-[4/5] block"
      >
        <ProductVideo
          productId={product.id}
          src={product.videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          playsInline
          muted
          autoPlay={isVisible}
          isActive={isVisible}
        />

        {/* Heart button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSaved();
          }}
          className="absolute top-3 end-3 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform active:scale-90 z-10"
        >
          <Heart
            size={20}
            className={
              isSaved
                ? 'text-red-500 fill-red-500'
                : 'text-white/70'
            }
          />
        </button>

        {/* Low stock badge */}
        {product.hasLowStock() && product.stock > 0 && (
          <div className="absolute top-3 start-3 px-2.5 py-1 rounded-full bg-red-500/90 text-white text-xs font-semibold animate-pulse z-10">
            {product.stock} left
          </div>
        )}

        {/* Promotion label */}
        {product.promotionLabel && (
          <div className="absolute top-14 start-3 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-semibold z-10">
            {product.promotionLabel}
          </div>
        )}

        {/* Bottom gradient overlay with product info */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-4 px-4 z-10">
          <h3 className="text-white font-bold text-base leading-tight line-clamp-2">
            {product.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            {hasDiscount ? (
              <>
                <span className="text-emerald-400 font-bold text-base">
                  {effectivePrice.format()}
                </span>
                <span className="text-zinc-400 line-through text-sm">
                  {product.price.format()}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  -{discountPercent}%
                </span>
              </>
            ) : (
              <span className="text-white font-bold text-base">
                {product.price.format()}
              </span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
