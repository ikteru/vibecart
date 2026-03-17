'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Volume2,
  VolumeX,
  ShoppingBag,
  AlertCircle,
  X,
  Play,
  Pause,
} from 'lucide-react';
import { SwipeButton } from '../ui/SwipeButton';
import { CheckoutDrawer } from '../checkout/CheckoutDrawer';
import { ProductVideo } from './ProductVideo';
import type { Product } from '@/domain/entities/Product';
import type { LocalOrder } from '@/presentation/hooks/useCustomerOrders';

interface ShopConfig {
  shipping?: {
    defaultRate: number;
    rules?: Array<{ city: string; rate: number }>;
  };
  pickup?: {
    enabled: boolean;
    storeName?: string;
    storeAddress?: string;
    storeCity?: string;
    storePhone?: string;
    requirePhoneConfirmation?: boolean;
    googleMapsUrl?: string;
    preparationTimeMinutes?: number;
    instructions?: string;
    discountPercent?: number;
    hours?: {
      alwaysOpen?: boolean;
      monday?: { open: string; close: string; closed?: boolean };
      tuesday?: { open: string; close: string; closed?: boolean };
      wednesday?: { open: string; close: string; closed?: boolean };
      thursday?: { open: string; close: string; closed?: boolean };
      friday?: { open: string; close: string; closed?: boolean };
      saturday?: { open: string; close: string; closed?: boolean };
      sunday?: { open: string; close: string; closed?: boolean };
    };
  };
}

interface VideoFeedProps {
  products: Product[];
  sellerId: string;
  initialVideoId?: string;
  onBack: () => void;
  shopConfig: ShopConfig;
  sellerName?: string;
  sellerHandle?: string;
  onOrderSuccess?: (order: LocalOrder) => void;
}

export function VideoFeed({
  products,
  sellerId,
  initialVideoId,
  onBack,
  shopConfig,
  onOrderSuccess,
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
      {/* Video Cards */}
      {products.map((product) => (
        <MinimalVideoCard
          key={product.id}
          product={product}
          isActive={activeVideoId === product.id}
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(!isMuted)}
          onBuy={() => setCheckoutProduct(product)}
          onClose={onBack}
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
          onOrderSuccess={onOrderSuccess}
        />
      )}
    </div>
  );
}

interface MinimalVideoCardProps {
  product: Product;
  isActive: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  onBuy: () => void;
  onClose: () => void;
}

function MinimalVideoCard({
  product,
  isActive,
  isMuted,
  onMuteToggle,
  onBuy,
  onClose,
}: MinimalVideoCardProps) {
  const t = useTranslations('publicFeed');
  const tFeed = useTranslations('customer.feed');
  const price = product.price;
  const discountPrice = product.discountPrice;
  const stock = product.stock;
  const displayPrice = discountPrice
    ? `${discountPrice.amount} ${discountPrice.currency}`
    : `${price.amount} ${price.currency}`;

  const [isPaused, setIsPaused] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isActive) setIsPaused(false);
  }, [isActive]);

  const handleVideoTap = useCallback(() => {
    setIsPaused((prev) => !prev);
    setShowPlayPause(true);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => setShowPlayPause(false), 800);
  }, []);

  const effectiveActive = isActive && !isPaused;

  return (
    <div
      id={`video-card-${product.id}`}
      data-id={product.id}
      className="video-card w-full h-[100dvh] snap-start relative bg-black"
    >
      {/* Full-screen video */}
      <div className="absolute inset-0">
        <ProductVideo
          productId={product.id}
          src={product.videoUrl}
          isActive={effectiveActive}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={isMuted}
        />
      </div>

      {/* Tap zone for play/pause */}
      <button
        onClick={handleVideoTap}
        className="absolute inset-0 bottom-36 z-10"
        aria-label={isPaused ? 'Play' : 'Pause'}
      />

      {/* Play/Pause indicator */}
      {showPlayPause && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center animate-[pulse-fade_0.8s_ease-out_forwards]">
            {isPaused ? (
              <Play size={28} className="text-white/80 fill-white/80 ms-1" />
            ) : (
              <Pause size={28} className="text-white/80 fill-white/80" />
            )}
          </div>
        </div>
      )}

      {/* Close button — top start */}
      <button
        onClick={onClose}
        className="absolute top-4 start-4 z-20 p-2 bg-black/20 backdrop-blur-sm rounded-full text-white/60"
      >
        <X size={16} />
      </button>

      {/* Mute button — top end */}
      <button
        onClick={onMuteToggle}
        className="absolute top-4 end-4 z-20 p-2 bg-black/20 backdrop-blur-sm rounded-full text-white/60"
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* Bottom overlay — compact */}
      <div className="absolute bottom-0 inset-x-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="relative px-4 pb-6 pt-10">
          {/* Product title */}
          <h2 className="text-sm font-medium text-white drop-shadow-lg line-clamp-1 mb-3">
            {product.title}
          </h2>

          {/* Stock badge */}
          {stock < 10 && stock > 0 && (
            <div className="flex gap-2 mb-3">
              <div className="flex items-center gap-1 bg-red-500/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <AlertCircle size={10} />
                <span>{tFeed('onlyLeft', { count: stock })}</span>
              </div>
            </div>
          )}

          {/* Swipe to Buy with price */}
          <SwipeButton
            onConfirm={onBuy}
            disabled={stock === 0}
            label={
              stock === 0
                ? t('outOfStock')
                : `${displayPrice} · ${t('slideToShop')}`
            }
            icon={<ShoppingBag size={20} className="text-white fill-white/20" />}
          />
        </div>
      </div>
    </div>
  );
}
