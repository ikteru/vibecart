'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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
  const t = useTranslations('publicFeed');
  const tSwipe = useTranslations('swipeButton');
  const tFeed = useTranslations('customer.feed');
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeVideoId, setActiveVideoId] = useState<string>(
    initialVideoId || products[0]?.id
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);

  const activeProduct = useMemo(
    () => products.find((p) => p.id === activeVideoId) || products[0],
    [products, activeVideoId]
  );

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

  // Scroll detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 300);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleBuy = useCallback(() => {
    if (activeProduct) setCheckoutProduct(activeProduct);
  }, [activeProduct]);

  // Price display for fixed SwipeButton
  const displayPrice = activeProduct
    ? activeProduct.discountPrice
      ? activeProduct.discountPrice.format(locale)
      : activeProduct.price.format(locale)
    : '';
  const activeStock = activeProduct?.stock ?? 0;

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
          onClose={onBack}
        />
      ))}

      {/* Fixed bottom gradient + SwipeButton */}
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-6 px-4 pointer-events-auto">
        <SwipeButton
          onConfirm={handleBuy}
          disabled={activeStock === 0}
          isBlocked={isScrolling}
          label={
            activeStock === 0
              ? t('outOfStock')
              : `${displayPrice} · ${t('slideToShop')}`
          }
          midLabel={tSwipe('keepGoing')}
          nearLabel={tSwipe('almostThere')}
          icon={<ShoppingBag size={20} className="text-white fill-white/20" />}
        />
        </div>
      </div>

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
  onClose: () => void;
}

function MinimalVideoCard({
  product,
  isActive,
  isMuted,
  onMuteToggle,
  onClose,
}: MinimalVideoCardProps) {
  const tFeed = useTranslations('customer.feed');
  const stock = product.stock;

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

      {/* Tap zone */}
      <button
        onClick={handleVideoTap}
        className="absolute inset-0 bottom-28 z-10"
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

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 start-4 z-20 p-2 bg-black/20 backdrop-blur-sm rounded-full text-white/60"
      >
        <X size={16} />
      </button>

      {/* Mute button */}
      <button
        onClick={onMuteToggle}
        className="absolute top-4 end-4 z-20 p-2 bg-black/20 backdrop-blur-sm rounded-full text-white/60"
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* Bottom info — above fixed SwipeButton */}
      <div className="absolute bottom-20 inset-x-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative px-4 pb-2 pt-8">
          <h2 className="text-sm font-medium text-white drop-shadow-lg line-clamp-1">
            {product.title}
          </h2>
          {stock < 10 && stock > 0 && (
            <div className="flex gap-2 mt-2">
              <div className="flex items-center gap-1 bg-red-500/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <AlertCircle size={10} />
                <span>{tFeed('onlyLeft', { count: stock })}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
