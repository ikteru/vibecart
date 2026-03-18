'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Volume2,
  VolumeX,
  ShoppingBag,
  AlertCircle,
  Loader2,
  Store,
  Play,
  Pause,
  Share2,
} from 'lucide-react';
import { SwipeButton } from '../ui/SwipeButton';
import { CheckoutDrawer } from '../checkout/CheckoutDrawer';
import { ProductVideo } from '../video/ProductVideo';
import { usePublicFeed } from '@/presentation/hooks/usePublicFeed';
import { Product } from '@/domain/entities/Product';
import { Money, type Currency } from '@/domain/value-objects/Money';
import { ProductCategory } from '@/domain/value-objects/ProductCategory';
import type { FeedProductDTO } from '@/application/dtos/FeedDTO';

interface PublicVideoFeedProps {
  initialProducts: FeedProductDTO[];
  initialCursor: string | null;
  isLoggedInSeller?: boolean;
}

function feedDtoToProduct(dto: FeedProductDTO): Product {
  return Product.fromPersistence({
    id: dto.id,
    sellerId: dto.sellerId,
    title: dto.title,
    description: dto.description,
    price: Money.create(dto.price.amount, dto.price.currency as Currency),
    discountPrice: dto.discountPrice
      ? Money.create(dto.discountPrice.amount, dto.discountPrice.currency as Currency)
      : undefined,
    promotionLabel: dto.promotionLabel || undefined,
    stock: dto.stock,
    videoUrl: dto.videoUrl || undefined,
    category: ProductCategory.create(dto.category),
    variants: dto.variants || [],
    isActive: dto.isActive,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.createdAt),
  });
}

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
    hours?: Record<string, { open: string; close: string; closed?: boolean }>;
  };
}

export function PublicVideoFeed({
  initialProducts,
  initialCursor,
}: PublicVideoFeedProps) {
  const t = useTranslations('publicFeed');
  const tSwipe = useTranslations('swipeButton');
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { products, isLoading, hasMore, loadMore } = usePublicFeed({
    initialProducts,
    initialCursor,
  });

  const [activeVideoId, setActiveVideoId] = useState<string>(
    products[0]?.id || ''
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<FeedProductDTO | null>(null);
  const [checkoutShopConfig, setCheckoutShopConfig] = useState<ShopConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Active product for the fixed SwipeButton
  const activeProduct = useMemo(
    () => products.find((p) => p.id === activeVideoId) || products[0],
    [products, activeVideoId]
  );

  // Scroll detection — debounced
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

    const videoElements = document.querySelectorAll('.public-video-card');
    videoElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [products]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  const handleBuy = useCallback(async () => {
    if (!activeProduct) return;
    setCheckoutProduct(activeProduct);
    setIsLoadingConfig(true);

    try {
      const res = await fetch(`/api/shop/${activeProduct.sellerId}/config`);
      const data = await res.json();
      setCheckoutShopConfig(data.success ? data.config : {});
    } catch {
      setCheckoutShopConfig({});
    } finally {
      setIsLoadingConfig(false);
    }
  }, [activeProduct]);

  const handleCloseCheckout = useCallback(() => {
    setCheckoutProduct(null);
    setCheckoutShopConfig(null);
  }, []);

  if (products.length === 0) {
    return (
      <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center gap-4 px-8">
        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-2">
          <Store size={36} className="text-zinc-600" />
        </div>
        <h2 className="text-white font-semibold text-lg">{t('noProducts')}</h2>
        <p className="text-zinc-500 text-sm text-center">{t('noProductsHint')}</p>
      </div>
    );
  }

  // Price display for fixed SwipeButton
  const displayPrice = activeProduct
    ? activeProduct.discountPrice
      ? Money.create(activeProduct.discountPrice.amount, activeProduct.discountPrice.currency as Currency).format(locale)
      : Money.create(activeProduct.price.amount, activeProduct.price.currency as Currency).format(locale)
    : '';
  const activeStock = activeProduct?.stock ?? 0;

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black relative"
    >
      {/* Video Cards */}
      {products.map((product) => (
        <PublicVideoCard
          key={product.id}
          product={product}
          isActive={activeVideoId === product.id}
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(!isMuted)}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="text-zinc-500 animate-spin" />
        </div>
      )}

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
      {checkoutProduct && checkoutShopConfig && !isLoadingConfig && (
        <CheckoutDrawer
          product={feedDtoToProduct(checkoutProduct)}
          sellerId={checkoutProduct.sellerId}
          isOpen={!!checkoutProduct}
          onClose={handleCloseCheckout}
          shopConfig={checkoutShopConfig}
        />
      )}

      {isLoadingConfig && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <Loader2 size={32} className="text-white animate-spin" />
        </div>
      )}
    </div>
  );
}

interface PublicVideoCardProps {
  product: FeedProductDTO;
  isActive: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

function PublicVideoCard({
  product,
  isActive,
  isMuted,
  onMuteToggle,
}: PublicVideoCardProps) {
  const locale = useLocale();
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
      className="public-video-card w-full h-[100dvh] snap-start relative bg-black"
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

      {/* Top-end buttons: mute + share */}
      <div className="absolute top-4 end-4 z-20 flex flex-col gap-2">
        <button
          onClick={onMuteToggle}
          className="p-2 bg-black/20 backdrop-blur-sm rounded-full text-white/60"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button
          onClick={() => {
            const url = `${window.location.origin}/${locale}/shop/${product.sellerHandle}/${product.id}`;
            navigator.clipboard.writeText(url);
          }}
          className="p-2 bg-black/20 backdrop-blur-sm rounded-full text-white/60"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* Bottom info — compact, above the fixed SwipeButton */}
      <div className="absolute bottom-20 inset-x-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative px-4 pb-2 pt-8">
          <a
            href={`/${locale}/shop/${product.sellerHandle}`}
            className="text-[11px] text-white/60 drop-shadow-lg mb-1 block"
          >
            @{product.sellerHandle}
          </a>
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
