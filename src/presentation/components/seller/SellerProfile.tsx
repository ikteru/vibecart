'use client';

import React, { useMemo, useState } from 'react';
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
import { ComingSoonModal } from '@/presentation/components/ui/ComingSoonModal';
import { DirectionalIcon } from '@/presentation/components/ui/DirectionalIcon';
import { ChatReviewDisplay } from '@/presentation/components/shop/ChatReviewDisplay';
import type { ChatReview, ChatPlatform } from '@/domain/entities/Seller';

/**
 * Avatar with letter+color fallback when image fails to load
 */
function AvatarWithFallback({
  src,
  name,
  size = 'md',
  className = '',
}: {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-5 h-5 text-[8px]',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  const colors = [
    'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500',
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
    'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-green-500',
  ];

  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bgColor = colors[colorIndex % colors.length];

  if (!src || hasError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full ${bgColor} flex items-center justify-center ${className}`}>
        <span className="font-bold text-white">{name.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
    />
  );
}

/**
 * Shop Configuration for SellerProfile
 */
interface ShopConfig {
  instagram?: {
    isConnected: boolean;
    handle?: string;
    followersCount?: number;
    profilePictureUrl?: string;
  };
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

/**
 * Format a number to a compact display format (e.g., 24500 -> 24.5k)
 */
function formatFollowersCount(count: number | undefined): string {
  if (!count) return '0';
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toString();
}

/**
 * Generate a consistent color based on a string (for avatar fallbacks)
 */
const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-pink-500',
  'bg-fuchsia-500',
  'bg-purple-500',
  'bg-violet-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-sky-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-green-500',
  'bg-lime-500',
  'bg-yellow-500',
  'bg-amber-500',
  'bg-orange-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
  | { type: 'maker-bio'; id: string; name: string; role: string; bio: string; image: string }
  | { type: 'chat-review'; data: ChatReview };

/**
 * SellerProfile Component
 *
 * Pinterest-style masonry grid showcasing seller's products
 * with mixed content cards (Google Maps, IG reviews, spotlight offers).
 */
type CategoryFilter = 'all' | 'newDrops' | 'bestSellers' | 'vintage' | 'sale';

export function SellerProfile({
  sellerName,
  sellerHandle,
  products,
  shopConfig,
  onBack,
  onSelectProduct,
}: SellerProfileProps) {
  const t = useTranslations();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [profileImageError, setProfileImageError] = useState(false);

  const showFeatureComingSoon = (feature: string) => {
    setComingSoonFeature(feature);
    setShowComingSoon(true);
  };

  // Filter products based on selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (selectedCategory) {
      case 'newDrops':
        return products.filter((p) => p.createdAt >= sevenDaysAgo);
      case 'sale':
        return products.filter((p) => p.discountPrice !== null);
      case 'bestSellers':
      case 'vintage':
        // These would require additional data, show all for now
        return products;
      default:
        return products;
    }
  }, [products, selectedCategory]);

  // Helper to insert at position or append if not enough items
  const insertOrAppend = (items: GridItemType[], position: number, item: GridItemType) => {
    if (items.length >= position) {
      items.splice(position, 0, item);
    } else {
      items.push(item);
    }
  };

  // Algorithmically mix content based on shopConfig
  const mixedContent: GridItemType[] = useMemo(() => {
    // Start with filtered products
    const items: GridItemType[] = filteredProducts.map((p) => ({
      type: 'product' as const,
      data: p,
    }));

    // Collect vibe cards to inject
    const vibeCards: { position: number; item: GridItemType }[] = [];

    // Google Maps Card (preferred position 2)
    if (shopConfig.googleMaps.enabled) {
      vibeCards.push({
        position: 1,
        item: {
          type: 'google-maps',
          id: 'gmaps-1',
          rating: shopConfig.googleMaps.rating,
          reviews: shopConfig.googleMaps.reviews,
          address: shopConfig.googleMaps.placeName,
        },
      });
    }

    // Spotlight Ad (preferred position 3)
    if (shopConfig.spotlight.enabled) {
      vibeCards.push({
        position: 2,
        item: {
          type: 'spotlight',
          id: 'spotlight-main',
          title: shopConfig.spotlight.title,
          subtitle: shopConfig.spotlight.subtitle,
          color: shopConfig.spotlight.color,
        },
      });
    }

    // Maker Bio (preferred position 5)
    if (shopConfig.makerBio.enabled) {
      vibeCards.push({
        position: 4,
        item: {
          type: 'maker-bio',
          id: 'maker-1',
          name: shopConfig.makerBio.name,
          role: shopConfig.makerBio.role,
          bio: shopConfig.makerBio.bio,
          image: shopConfig.makerBio.imageUrl,
        },
      });
    }

    // Pinned Reviews (preferred positions 4, 8)
    const enabledReviews = shopConfig.reviews.filter((r) => r.enabled);
    enabledReviews.slice(0, 2).forEach((review, idx) => {
      vibeCards.push({
        position: idx === 0 ? 3 : 7,
        item: {
          type: 'ig-story-review',
          id: review.id,
          username: review.username,
          image: review.image,
          note: review.note,
        },
      });
    });

    // Chat Reviews (preferred positions 6, 10)
    const chatReviews = shopConfig.chatReviews || [];
    chatReviews.slice(0, 2).forEach((review, idx) => {
      vibeCards.push({
        position: idx === 0 ? 5 : 9,
        item: {
          type: 'chat-review',
          data: review,
        },
      });
    });

    // Sort by position and insert
    vibeCards.sort((a, b) => a.position - b.position);
    vibeCards.forEach(({ position, item }) => {
      insertOrAppend(items, position, item);
    });

    return items;
  }, [filteredProducts, shopConfig]);

  // Pinterest aspect ratio logic
  const getAspectRatio = (index: number, type: string) => {
    if (type === 'ig-story-review') return 'aspect-[9/16]';
    if (type === 'chat-review') return 'aspect-[9/16]';
    if (type === 'spotlight') return 'aspect-square';
    if (type === 'google-maps') return 'aspect-[4/3]';

    const ratios = ['aspect-[3/4]', 'aspect-[9/16]', 'aspect-[4/5]', 'aspect-[2/3]'];
    return ratios[index % ratios.length];
  };

  return (
    <div className="h-full bg-black text-white pb-20 overflow-y-auto no-scrollbar">
      {/* Navigation - Back button fixed on LEFT, share button on RIGHT */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl px-4 py-4 flex justify-end items-center border-b border-white/5 relative mt-2">
        <button
          onClick={onBack}
          className="absolute left-3 p-2.5 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <DirectionalIcon icon={ArrowLeft} size={20} />
        </button>
        <div className="absolute right-3 flex gap-2">
          <button
            onClick={() => showFeatureComingSoon(t('common.share'))}
            className="p-2.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-row items-center gap-4 px-5 py-6 animate-fade-in">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 via-emerald-400 to-cyan-500 p-[2px] shadow-lg">
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border-2 border-black">
              {shopConfig.makerBio.enabled && shopConfig.makerBio.imageUrl && !profileImageError ? (
                <img
                  src={shopConfig.makerBio.imageUrl}
                  className="w-full h-full object-cover"
                  alt="Profile"
                  onError={() => setProfileImageError(true)}
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${getAvatarColor(sellerName)}`}>
                  <span className="text-2xl font-bold text-white">
                    {sellerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 end-0 bg-blue-500 text-white p-1 rounded-full border-4 border-black">
            <Check size={10} strokeWidth={4} />
          </div>
        </div>

        <div className="flex flex-col items-start text-start min-w-0">
          <h1 className="text-xl font-bold tracking-tight leading-tight truncate w-full">
            {sellerName}
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
            @{sellerHandle || sellerName.toLowerCase().replace(/\s+/g, '_')}
          </p>
          <div className="flex gap-4 text-sm">
            {shopConfig.instagram?.isConnected && shopConfig.instagram.followersCount && (
              <div>
                <span className="font-bold text-white">{formatFollowersCount(shopConfig.instagram.followersCount)}</span>{' '}
                <span className="text-zinc-500">{t('seller.profile.followers')}</span>
              </div>
            )}
            <div>
              <span className="font-bold text-white">{shopConfig.googleMaps.rating}</span>{' '}
              <span className="text-zinc-500">{t('seller.profile.rating')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories / Chips */}
      <div className="px-5 pb-4 flex gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
        {(['all', 'newDrops', 'bestSellers', 'vintage', 'sale'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-white text-black'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
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
                      <div className="absolute top-2 start-2 bg-red-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-sm">
                        {t('product.lowStock', { count: product.stock })}
                      </div>
                    )}

                    <div className="absolute bottom-2 start-2 end-2 flex justify-between items-end">
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
                    <button
                      onClick={() => showFeatureComingSoon(t('seller.profile.findUs'))}
                      className="w-full py-1.5 bg-[#4285F4] text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 hover:bg-blue-600 transition-colors"
                    >
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

            // --- 3.5 CHAT REVIEW CARD ---
            if (item.type === 'chat-review') {
              return (
                <div
                  key={item.data.id}
                  className="break-inside-avoid mb-2 w-full"
                >
                  <ChatReviewDisplay review={item.data} />
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
                  <div className="absolute top-0 end-0 p-3 opacity-20">
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
                  <button
                    onClick={() => showFeatureComingSoon(t('seller.profile.shopNow'))}
                    className="mt-4 bg-white text-black text-[10px] font-bold py-2 rounded-full w-full"
                  >
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
                    <AvatarWithFallback
                      src={item.image}
                      name={item.name}
                      size="md"
                      className="border border-zinc-700"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <p className="text-[9px] text-zinc-500 uppercase">{item.role}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Quote size={12} className="absolute -top-1 -start-1 text-zinc-700" />
                    <p className="text-[10px] text-zinc-400 italic ps-3 leading-relaxed">
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

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        featureName={comingSoonFeature}
      />
    </div>
  );
}
