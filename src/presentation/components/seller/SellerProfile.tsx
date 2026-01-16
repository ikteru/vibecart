'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Product } from '@/domain/entities/Product';
import {
  ArrowLeft,
  Share2,
  Play,
  Check,
  Star,
  MapPin,
  Instagram,
  Clock,
  Quote,
} from 'lucide-react';

/**
 * Shop Configuration for SellerProfile
 */
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
}

interface SellerProfileProps {
  sellerName: string;
  sellerHandle?: string;
  products: Product[];
  shopConfig: ShopConfig;
  onBack: () => void;
  onSelectProduct: (productId: string) => void;
}

/**
 * Grid Item Types for mixed content display
 */
type GridItemType =
  | { type: 'product'; data: Product }
  | { type: 'spotlight'; id: string; title: string; subtitle: string; color: string }
  | { type: 'google-maps'; id: string; rating: number; reviews: number; address: string }
  | { type: 'ig-story-review'; id: string; username: string; image: string; note: string }
  | { type: 'maker-bio'; id: string; name: string; role: string; bio: string; image: string };

/**
 * SellerProfile Component
 *
 * Pinterest-style masonry grid showcasing seller's products
 * with mixed content cards (Google Maps, IG reviews, spotlight offers).
 */
export function SellerProfile({
  sellerName,
  sellerHandle,
  products,
  shopConfig,
  onBack,
  onSelectProduct,
}: SellerProfileProps) {
  const t = useTranslations();

  // Algorithmically mix content based on shopConfig
  const mixedContent: GridItemType[] = useMemo(() => {
    // Start with products
    const items: GridItemType[] = products.map((p) => ({
      type: 'product' as const,
      data: p,
    }));

    // Inject: Google Maps Card (Position 2)
    if (shopConfig.googleMaps.enabled && items.length > 1) {
      items.splice(1, 0, {
        type: 'google-maps',
        id: 'gmaps-1',
        rating: shopConfig.googleMaps.rating,
        reviews: shopConfig.googleMaps.reviews,
        address: shopConfig.googleMaps.placeName,
      });
    }

    // Inject: Enabled IG Story Reviews (Position 4, 10, etc)
    const enabledReviews = shopConfig.reviews.filter((r) => r.enabled);
    if (enabledReviews.length > 0 && items.length > 3) {
      items.splice(3, 0, {
        type: 'ig-story-review',
        id: enabledReviews[0].id,
        username: enabledReviews[0].username,
        image: enabledReviews[0].image,
        note: enabledReviews[0].note,
      });
    }
    // Add a second review further down if available
    if (enabledReviews.length > 1 && items.length > 10) {
      items.splice(10, 0, {
        type: 'ig-story-review',
        id: enabledReviews[1].id,
        username: enabledReviews[1].username,
        image: enabledReviews[1].image,
        note: enabledReviews[1].note,
      });
    }

    // Inject: Spotlight Ad (Position 7)
    if (shopConfig.spotlight.enabled && items.length > 6) {
      items.splice(6, 0, {
        type: 'spotlight',
        id: 'spotlight-main',
        title: shopConfig.spotlight.title,
        subtitle: shopConfig.spotlight.subtitle,
        color: shopConfig.spotlight.color,
      });
    }

    // Inject: Maker Bio (Position 9)
    if (shopConfig.makerBio.enabled && items.length > 8) {
      items.splice(8, 0, {
        type: 'maker-bio',
        id: 'maker-1',
        name: shopConfig.makerBio.name,
        role: shopConfig.makerBio.role,
        bio: shopConfig.makerBio.bio,
        image: shopConfig.makerBio.imageUrl,
      });
    }

    return items;
  }, [products, shopConfig]);

  // Pinterest aspect ratio logic
  const getAspectRatio = (index: number, type: string) => {
    if (type === 'ig-story-review') return 'aspect-[9/16]';
    if (type === 'spotlight') return 'aspect-square';
    if (type === 'google-maps') return 'aspect-[4/3]';

    const ratios = ['aspect-[3/4]', 'aspect-[9/16]', 'aspect-[4/5]', 'aspect-[2/3]'];
    return ratios[index % ratios.length];
  };

  return (
    <div className="h-full bg-black text-white pb-20 overflow-y-auto no-scrollbar">
      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl px-4 py-3 flex justify-between items-center border-b border-white/5">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-row items-center gap-4 px-5 py-6 animate-fade-in">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 via-emerald-400 to-cyan-500 p-[2px] shadow-lg">
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border-2 border-black">
              {shopConfig.makerBio.enabled ? (
                <img
                  src={shopConfig.makerBio.imageUrl}
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              ) : (
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-tr from-emerald-400 to-cyan-400">
                  {sellerName.charAt(0)}
                </span>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-4 border-black">
            <Check size={10} strokeWidth={4} />
          </div>
        </div>

        <div className="flex flex-col items-start text-left min-w-0">
          <h1 className="text-xl font-bold tracking-tight leading-tight truncate w-full">
            {sellerName}
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
            @{sellerHandle || sellerName.toLowerCase().replace(/\s+/g, '_')}
          </p>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-bold text-white">24.5k</span>{' '}
              <span className="text-zinc-500">{t('seller.profile.followers')}</span>
            </div>
            <div>
              <span className="font-bold text-white">{shopConfig.googleMaps.rating}</span>{' '}
              <span className="text-zinc-500">{t('seller.profile.rating')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories / Chips */}
      <div className="px-5 pb-4 flex gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
        {(['all', 'newDrops', 'bestSellers', 'vintage', 'sale'] as const).map((cat, i) => (
          <button
            key={cat}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
              i === 0
                ? 'bg-white text-black'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            {t(`seller.profile.categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Pinterest Masonry Grid */}
      <div className="px-2 pb-20">
        <div className="columns-2 gap-2 w-full space-y-2">
          {mixedContent.map((item, index) => {
            // --- 1. PRODUCT CARD ---
            if (item.type === 'product') {
              const product = item.data;
              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product.id)}
                  className="break-inside-avoid cursor-pointer group mb-2"
                >
                  <div
                    className={`relative w-full ${getAspectRatio(index, 'product')} rounded-xl overflow-hidden bg-zinc-800 mb-2 transform transition-transform duration-300 active:scale-95 shadow-lg`}
                  >
                    <video
                      src={product.videoUrl || undefined}
                      className="absolute inset-0 w-full h-full object-cover opacity-90"
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

                    {product.stock <= 3 && (
                      <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-sm">
                        {t('product.lowStock', { count: product.stock })}
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                      <span className="text-white text-sm font-bold drop-shadow-md">
                        {product.price.amount}{' '}
                        <span className="text-[10px]">{product.price.currency}</span>
                      </span>
                      <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full">
                        <Play size={10} fill="white" className="text-white" />
                      </div>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-[10px] font-medium leading-tight px-1 truncate">
                    {product.title}
                  </p>
                </div>
              );
            }

            // --- 2. GOOGLE MAPS CARD ---
            if (item.type === 'google-maps') {
              return (
                <div
                  key={item.id}
                  className="break-inside-avoid mb-2 w-full bg-white rounded-xl p-3 flex flex-col justify-between border border-zinc-200 relative group overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="bg-[#4285F4] p-1.5 rounded-lg">
                      <MapPin size={14} className="text-white" />
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-black font-bold text-sm">
                        <span>{item.rating}</span>
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                      </div>
                      <span className="text-[9px] text-zinc-500 font-bold">
                        {item.reviews} {t('seller.profile.reviews')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-[10px] text-zinc-800 font-bold leading-tight mb-2">
                      &quot;{item.address}&quot;
                    </p>
                    <button className="w-full py-1.5 bg-[#4285F4] text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 hover:bg-blue-600 transition-colors">
                      {t('seller.profile.findUs')}
                    </button>
                  </div>
                </div>
              );
            }

            // --- 3. IG STORY REVIEW CARD ---
            if (item.type === 'ig-story-review') {
              return (
                <div
                  key={item.id}
                  className="break-inside-avoid mb-2 w-full aspect-[9/16] relative rounded-xl overflow-hidden border-2 border-transparent group"
                >
                  {/* Instagram Gradient Border imitation */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 p-[2px] -z-10 rounded-xl"></div>

                  <img src={item.image} className="w-full h-full object-cover" alt="Review" />
                  <div className="absolute inset-0 bg-black/30 flex flex-col justify-between p-3">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                          <Instagram size={10} className="text-white" />
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-white shadow-sm">
                        @{item.username}
                      </span>
                    </div>
                    <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/10 transform rotate-2">
                      <div className="flex text-yellow-400 mb-1">
                        <Star size={8} fill="currentColor" />
                        <Star size={8} fill="currentColor" />
                        <Star size={8} fill="currentColor" />
                        <Star size={8} fill="currentColor" />
                        <Star size={8} fill="currentColor" />
                      </div>
                      <p className="text-[10px] text-white leading-tight">&quot;{item.note}&quot;</p>
                    </div>
                  </div>
                </div>
              );
            }

            // --- 4. SPOTLIGHT / AD CARD ---
            if (item.type === 'spotlight') {
              return (
                <div
                  key={item.id}
                  className={`break-inside-avoid mb-2 w-full bg-gradient-to-br ${item.color} rounded-xl p-4 flex flex-col justify-between relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Clock size={40} className="text-white" />
                  </div>
                  <div>
                    <span className="inline-block px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded text-[8px] font-bold text-white mb-2 uppercase tracking-widest">
                      {t('seller.profile.limited')}
                    </span>
                    <h3 className="text-xl font-black text-white leading-none uppercase">
                      {item.title}
                    </h3>
                    <p className="text-white/90 text-xs font-medium mt-1">{item.subtitle}</p>
                  </div>
                  <button className="mt-4 bg-white text-black text-[10px] font-bold py-2 rounded-full w-full">
                    {t('seller.profile.shopNow')}
                  </button>
                </div>
              );
            }

            // --- 5. MAKER BIO ---
            if (item.type === 'maker-bio') {
              return (
                <div
                  key={item.id}
                  className="break-inside-avoid mb-2 w-full bg-zinc-900 rounded-xl p-3 border border-zinc-800"
                >
                  <div className="flex gap-3 items-center mb-2">
                    <img
                      src={item.image}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                      alt={item.name}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <p className="text-[9px] text-zinc-500 uppercase">{item.role}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Quote size={12} className="absolute -top-1 -left-1 text-zinc-700" />
                    <p className="text-[10px] text-zinc-400 italic pl-3 leading-relaxed">
                      {item.bio}
                    </p>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
