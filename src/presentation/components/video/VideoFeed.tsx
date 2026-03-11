'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Volume2, VolumeX, ArrowLeft, ShoppingBag, AlertCircle, X } from 'lucide-react';
import { DirectionalIcon } from '../ui/DirectionalIcon';
import { SwipeButton } from '../ui/SwipeButton';
import { CheckoutDrawer } from '../checkout/CheckoutDrawer';
import { ProductVideo } from './ProductVideo';
import type { Product } from '@/domain/entities/Product';
import type { LocalOrder } from '@/presentation/hooks/useCustomerOrders';

// Simplified ShopConfiguration for VideoFeed (can be expanded later)
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
  sellerName,
  sellerHandle,
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
      {/* Fixed header — seller info + close button */}
      <div className="fixed top-0 inset-x-0 z-30 bg-gradient-to-b from-black/60 to-transparent pt-3 pb-8 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {sellerName && (
              <>
                <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center border-2 border-white/20">
                  <span className="text-white font-bold text-sm">
                    {sellerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">{sellerName}</p>
                  {sellerHandle && (
                    <p className="text-white/50 text-xs">@{sellerHandle}</p>
                  )}
                </div>
              </>
            )}
            {!sellerName && (
              <button
                onClick={onBack}
                className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10"
              >
                <DirectionalIcon icon={ArrowLeft} size={20} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={onBack}
              className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>
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
          onOrderSuccess={onOrderSuccess}
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
        <ProductVideo
          productId={product.id}
          src={product.videoUrl}
          isActive={isActive}
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
