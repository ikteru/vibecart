'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Heart, Package } from 'lucide-react';
import type { Product } from '@/domain/entities/Product';
import { ProductFeedCard } from './ProductFeedCard';
import { CategoryChips } from './CategoryChips';
import type { ChatPlatform } from '@/domain/entities/Seller';

interface ShopConfig {
  googleMaps: {
    enabled: boolean;
    rating: number;
    reviews: number;
    placeName: string;
  };
  spotlight: {
    enabled: boolean;
    title: string;
    subtitle: string;
    color: string;
  };
  makerBio: {
    enabled: boolean;
    name: string;
    role: string;
    bio: string;
    imageUrl: string;
  };
  reviews: Array<{
    id: string;
    enabled: boolean;
    username: string;
    image: string;
    note: string;
  }>;
  chatReviews: Array<{
    id: string;
    platform: ChatPlatform;
    screenshotUrl: string;
    customerName: string;
    createdAt: string;
  }>;
}

interface CustomerFeedProps {
  sellerName: string;
  sellerHandle?: string;
  sellerAvatar?: string;
  products: Product[];
  shopConfig: ShopConfig;
  onSelectProduct: (productId: string) => void;
  isSaved: (productId: string) => boolean;
  onToggleSaved: (product: Product) => void;
  hasOrderUpdates?: boolean;
  onNotificationTap?: () => void;
}

export function CustomerFeed({
  sellerName,
  sellerHandle,
  sellerAvatar,
  products,
  shopConfig,
  onSelectProduct,
  isSaved,
  onToggleSaved,
  hasOrderUpdates = false,
  onNotificationTap,
}: CustomerFeedProps) {
  const t = useTranslations('customer.feed');
  const [activeCategory, setActiveCategory] = useState('all');

  // Extract unique categories from products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        cats.add(p.category.value);
      }
    });
    return Array.from(cats);
  }, [products]);

  const hasSaleItems = products.some((p) => !!p.discountPrice);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    if (activeCategory === t('sale')) {
      return products.filter((p) => !!p.discountPrice);
    }
    return products.filter((p) => p.category?.value === activeCategory);
  }, [products, activeCategory, t]);

  // Build feed items with vibe cards interspersed
  const feedItems = useMemo(() => {
    const items: Array<
      | { type: 'product'; data: Product }
      | { type: 'spotlight' }
      | { type: 'makerBio' }
      | { type: 'googleMaps' }
      | { type: 'review'; data: { username: string; image: string; note: string } }
      | { type: 'chatReview'; data: { screenshotUrl: string; customerName: string; platform: ChatPlatform } }
    > = [];

    filteredProducts.forEach((product, index) => {
      // Inject vibe cards at specific positions (only when showing "all")
      if (activeCategory === 'all') {
        if (index === 2 && shopConfig.googleMaps.enabled) {
          items.push({ type: 'googleMaps' });
        }
        if (index === 3 && shopConfig.spotlight.enabled) {
          items.push({ type: 'spotlight' });
        }
        if (index === 4 && shopConfig.reviews.length > 0) {
          items.push({ type: 'review', data: shopConfig.reviews[0] });
        }
        if (index === 5 && shopConfig.makerBio.enabled) {
          items.push({ type: 'makerBio' });
        }
        if (index === 6 && shopConfig.chatReviews.length > 0) {
          items.push({
            type: 'chatReview',
            data: shopConfig.chatReviews[0],
          });
        }
        if (index === 8 && shopConfig.reviews.length > 1) {
          items.push({ type: 'review', data: shopConfig.reviews[1] });
        }
        if (index === 10 && shopConfig.chatReviews.length > 1) {
          items.push({
            type: 'chatReview',
            data: shopConfig.chatReviews[1],
          });
        }
      }
      items.push({ type: 'product', data: product });
    });

    return items;
  }, [filteredProducts, activeCategory, shopConfig]);

  // Avatar fallback
  const avatarLetter = sellerName.charAt(0).toUpperCase();
  const avatarColors = [
    'bg-rose-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  ];
  const avatarColor = avatarColors[
    sellerName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length
  ];

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {sellerAvatar ? (
              <img
                src={sellerAvatar}
                alt={sellerName}
                className="w-9 h-9 rounded-full object-cover border-2 border-zinc-700"
              />
            ) : (
              <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center border-2 border-zinc-700`}>
                <span className="text-white font-bold text-sm">{avatarLetter}</span>
              </div>
            )}
            <div>
              <h1 className="text-white font-bold text-base leading-tight">{sellerName}</h1>
              {sellerHandle && (
                <span className="text-zinc-500 text-xs">@{sellerHandle}</span>
              )}
            </div>
          </div>

          {/* Notification bell */}
          <button
            onClick={onNotificationTap}
            className="relative p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <Bell size={20} className="text-zinc-400" />
            {hasOrderUpdates && (
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Category chips */}
        <CategoryChips
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          hasSaleItems={hasSaleItems}
        />
      </div>

      {/* Feed */}
      <div className="px-4 pt-3 space-y-4">
        {feedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={48} className="text-zinc-600 mb-4" />
            <p className="text-zinc-400 font-medium">{t('noProducts')}</p>
            <p className="text-zinc-600 text-sm mt-1">{t('noProductsHint')}</p>
          </div>
        )}

        {feedItems.map((item, index) => {
          if (item.type === 'product') {
            return (
              <ProductFeedCard
                key={item.data.id}
                product={item.data}
                isSaved={isSaved(item.data.id)}
                onToggleSaved={() => onToggleSaved(item.data)}
                onTap={() => onSelectProduct(item.data.id)}
              />
            );
          }

          if (item.type === 'spotlight') {
            return (
              <div
                key={`spotlight-${index}`}
                className={`rounded-2xl bg-gradient-to-br ${shopConfig.spotlight.color || 'from-emerald-500 to-teal-600'} p-6`}
              >
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                  LIMITED
                </span>
                <h3 className="text-white font-bold text-xl mt-2">
                  {shopConfig.spotlight.title}
                </h3>
                <p className="text-white/80 text-sm mt-1">
                  {shopConfig.spotlight.subtitle}
                </p>
              </div>
            );
          }

          if (item.type === 'makerBio') {
            return (
              <div
                key={`maker-${index}`}
                className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  {shopConfig.makerBio.imageUrl ? (
                    <img
                      src={shopConfig.makerBio.imageUrl}
                      alt={shopConfig.makerBio.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center`}>
                      <span className="text-white font-bold">{shopConfig.makerBio.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold">{shopConfig.makerBio.name}</p>
                    <p className="text-zinc-500 text-sm">{shopConfig.makerBio.role}</p>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm italic leading-relaxed">
                  &ldquo;{shopConfig.makerBio.bio}&rdquo;
                </p>
              </div>
            );
          }

          if (item.type === 'googleMaps') {
            return (
              <div
                key={`maps-${index}`}
                className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📍</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {shopConfig.googleMaps.placeName}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-zinc-400 text-xs">
                      {shopConfig.googleMaps.rating} · {shopConfig.googleMaps.reviews} reviews
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          if (item.type === 'review') {
            return (
              <div
                key={`review-${index}`}
                className="rounded-2xl overflow-hidden relative aspect-[9/16] max-h-[400px]"
              >
                <img
                  src={item.data.image}
                  alt={item.data.username}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 start-4 end-4">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="text-yellow-400 text-xs">★</span>
                    ))}
                  </div>
                  <p className="text-white text-sm font-medium">{item.data.note}</p>
                  <p className="text-zinc-400 text-xs mt-1">@{item.data.username}</p>
                </div>
              </div>
            );
          }

          if (item.type === 'chatReview') {
            return (
              <div
                key={`chat-${index}`}
                className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800"
              >
                <img
                  src={item.data.screenshotUrl}
                  alt={item.data.customerName}
                  className="w-full object-contain max-h-[400px]"
                />
                <div className="px-4 py-3 flex items-center gap-2">
                  <span className="text-xs">
                    {item.data.platform === 'whatsapp' ? '💬' : '📸'}
                  </span>
                  <span className="text-zinc-400 text-xs">{item.data.customerName}</span>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
