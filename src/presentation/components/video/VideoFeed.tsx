'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Volume2, VolumeX, ArrowLeft, ShoppingBag, AlertCircle } from 'lucide-react';
import { DirectionalIcon } from '../ui/DirectionalIcon';
import { SwipeButton } from '../ui/SwipeButton';
import { CheckoutDrawer } from '../checkout/CheckoutDrawer';
import type { Product } from '@/domain/entities/Product';

// Simplified ShopConfiguration for VideoFeed (can be expanded later)
interface ShopConfig {
  shipping?: {
    defaultRate: number;
    rules?: Array<{ city: string; rate: number }>;
  };
}

interface VideoFeedProps {
  products: Product[];
  sellerId: string;
  initialVideoId?: string;
  onBack: () => void;
  shopConfig: ShopConfig;
}

/**
 * VideoFeed Component
 *
 * TikTok-style vertical video feed for browsing products.
 * Full-screen snapping, auto-play, and swipe-to-buy interaction.
 */
export function VideoFeed({
  products,
  sellerId,
  initialVideoId,
  onBack,
  shopConfig,
}: VideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeVideoId, setActiveVideoId] = useState<string>(
    initialVideoId || products[0]?.id
  );
  const [isMuted, setIsMuted] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);

  // Scroll to initial video on mount
  useEffect(() => {
    if (initialVideoId && containerRef.current) {
      setTimeout(() => {
        const el = document.getElementById(`video-card-${initialVideoId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'auto' });
        }
      }, 50);
    }
  }, [initialVideoId]);

  // Intersection Observer for video activation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id');
            if (id) setActiveVideoId(id);
          }
        });
      },
      { threshold: 0.6 }
    );

    const videoElements = document.querySelectorAll('.video-card');
    videoElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [products]);

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black relative"
    >
      {/* Fixed Controls - Back button on LEFT, Volume on RIGHT */}
      <div className="fixed top-4 left-4 z-30">
        <button
          onClick={onBack}
          className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-black/60 transition-colors"
        >
          <DirectionalIcon icon={ArrowLeft} size={24} />
        </button>
      </div>
      <div className="fixed top-4 right-4 z-30">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-black/60 transition-colors"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {/* Video Cards */}
      {products.map((product) => (
        <VideoCard
          key={product.id}
          product={product}
          isActive={activeVideoId === product.id}
          isMuted={isMuted}
          onBuy={() => setCheckoutProduct(product)}
        />
      ))}

      {/* Checkout Drawer */}
      {checkoutProduct && (
        <CheckoutDrawer
          product={checkoutProduct}
          sellerId={sellerId}
          isOpen={!!checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          shopConfig={shopConfig}
        />
      )}
    </div>
  );
}

interface VideoCardProps {
  product: Product;
  isActive: boolean;
  isMuted: boolean;
  onBuy: () => void;
}

/**
 * VideoCard Component
 *
 * Individual product card with video, price, and buy button.
 */
function VideoCard({
  product,
  isActive,
  isMuted,
  onBuy,
}: VideoCardProps) {
  const t = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play/pause based on visibility
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {
          // Autoplay blocked by browser - expected behavior, no action needed
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const price = product.price;
  const discountPrice = product.discountPrice;
  const stock = product.stock;

  return (
    <div
      id={`video-card-${product.id}`}
      data-id={product.id}
      className="video-card w-full h-[100dvh] snap-start flex flex-col bg-black p-3 pb-8"
    >
      {/* Video Container - corners match button roundness */}
      <div className="relative flex-1 w-full rounded-3xl overflow-hidden shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)] border border-zinc-800/50 bg-zinc-900">
        <video
          ref={videoRef}
          src={product.videoUrl || undefined}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          playsInline
          muted={isMuted}
        />

        {/* Badges */}
        <div className="absolute bottom-4 start-4 z-20 flex gap-2">
          {stock < 10 && stock > 0 && (
            <div className="flex items-center gap-1 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
              <AlertCircle size={10} />
              <span>{t('product.lowStock', { count: stock })}</span>
            </div>
          )}
          {product.promotionLabel && (
            <div className="bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
              {product.promotionLabel}
            </div>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="mt-5 px-2 flex flex-col gap-6">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-white leading-tight flex-1">
            {product.title}
          </h2>

          <div className="flex flex-col items-end shrink-0">
            {discountPrice ? (
              <>
                <span className="text-2xl font-bold text-emerald-400">
                  {discountPrice.amount}
                  <span className="text-sm ms-1 text-emerald-500/80">{discountPrice.currency}</span>
                </span>
                <span className="text-xs text-zinc-600 line-through font-medium">
                  {price.amount}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-white">
                {price.amount}
                <span className="text-sm ms-1 text-zinc-500">{price.currency}</span>
              </span>
            )}
          </div>
        </div>

        {/* Swipe to Buy */}
        <SwipeButton
          onConfirm={onBuy}
          disabled={stock === 0}
          label={stock === 0 ? t('product.outOfStock') : t('product.slideToBuy')}
          icon={<ShoppingBag size={20} className="text-white fill-white/20" />}
        />
      </div>
    </div>
  );
}
