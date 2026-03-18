'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Settings,
  Copy,
  Check,
  Grid3X3,
  List,
  Package,
} from 'lucide-react';
import type { SellerResponseDTO } from '@/application/dtos/SellerDTO';
import type { ProductResponseDTO } from '@/application/dtos/ProductDTO';

interface SellerProfileTabProps {
  seller: SellerResponseDTO;
  stats: {
    productCount: number;
    totalOrders: number;
    totalRevenue: number;
  };
  products: ProductResponseDTO[];
  drafts: ProductResponseDTO[];
  locale: string;
}

export function SellerProfileTab({
  seller,
  stats,
  products,
  drafts,
  locale,
}: SellerProfileTabProps) {
  const t = useTranslations('sellerProfile');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [linkCopied, setLinkCopied] = useState(false);

  const allProducts = [...products, ...drafts];
  const shopUrl = `vibecart.app/${seller.handle}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${shopUrl}`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Avatar
  const makerBio = seller.shopConfig?.vibe?.makerBio;
  const avatarUrl = makerBio?.imageUrl;
  const avatarLetter = seller.shopName.charAt(0).toUpperCase();
  const avatarColors = [
    'bg-rose-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  ];
  const avatarColor = avatarColors[
    seller.shopName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length
  ];

  return (
    <div className="animate-fade-in -mx-6 -mt-6">
      {/* Header with settings gear */}
      <div className="flex justify-end px-4 pt-4">
        <Link
          href={`/${locale}/seller/settings`}
          className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <Settings size={22} className="text-zinc-400" />
        </Link>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center px-4 pb-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={seller.shopName}
            className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700 mb-3"
          />
        ) : (
          <div className={`w-20 h-20 rounded-full ${avatarColor} flex items-center justify-center border-2 border-zinc-700 mb-3`}>
            <span className="text-white font-bold text-2xl">{avatarLetter}</span>
          </div>
        )}
        <h1 className="text-white font-bold text-xl">{seller.shopName}</h1>
        <p className="text-zinc-500 text-sm">@{seller.handle}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 border-y border-zinc-800 mx-4 py-4 mb-4">
        <div className="flex flex-col items-center">
          <span className="text-white font-bold text-lg">{stats.productCount}</span>
          <span className="text-zinc-500 text-xs">{t('products')}</span>
        </div>
        <div className="flex flex-col items-center border-x border-zinc-800">
          <span className="text-white font-bold text-lg">{stats.totalOrders}</span>
          <span className="text-zinc-500 text-xs">{t('orders')}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-white font-bold text-lg">
            {stats.totalRevenue > 1000
              ? `${(stats.totalRevenue / 1000).toFixed(1)}K`
              : stats.totalRevenue}
          </span>
          <span className="text-zinc-500 text-xs">{t('revenue')}</span>
        </div>
      </div>

      {/* Edit Profile button */}
      <div className="px-4 mb-4">
        <Link
          href={`/${locale}/seller/profile/edit`}
          className="block w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl text-center transition-colors"
        >
          {t('editProfile')}
        </Link>
      </div>

      {/* Product grid header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-white font-semibold text-sm">{t('myProducts')}</h2>
        <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
            }`}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
            }`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Products */}
      {allProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
            <Package size={24} className="text-zinc-500" />
          </div>
          <p className="text-zinc-400 font-medium text-sm">{t('noProducts')}</p>
          <p className="text-zinc-600 text-xs mt-1">{t('noProductsHint')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-3 gap-0.5 px-4">
          {allProducts.map((product) => (
            <Link
              key={product.id}
              href={`/${locale}/seller/inventory/${product.id}/edit`}
              className="relative aspect-square bg-zinc-800 overflow-hidden"
            >
              {product.videoUrl ? (
                <video
                  src={product.videoUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={20} className="text-zinc-600" />
                </div>
              )}
              {!product.isActive && (
                <span className="absolute top-1 start-1 px-1.5 py-0.5 rounded bg-zinc-900/80 text-zinc-400 text-[9px] font-bold">
                  {t('draftBadge')}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {allProducts.map((product) => (
            <Link
              key={product.id}
              href={`/${locale}/seller/inventory/${product.id}/edit`}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3"
            >
              <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                {product.videoUrl ? (
                  <video
                    src={product.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={14} className="text-zinc-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{product.title}</p>
                <p className="text-zinc-500 text-xs">
                  {(product.effectivePrice.amount / 100).toFixed(0)} {product.effectivePrice.currency}
                  {!product.isActive && (
                    <span className="ms-2 text-zinc-600">· {t('draftBadge')}</span>
                  )}
                </p>
              </div>
              <span className="text-zinc-500 text-xs">
                {product.stock}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Share shop link */}
      <div className="mx-4 mt-6 mb-8 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <h3 className="text-white font-semibold text-sm mb-2">{t('shareShopLink')}</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-black rounded-lg px-3 py-2 text-zinc-400 text-sm truncate">
            {shopUrl}
          </div>
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
          >
            {linkCopied ? (
              <Check size={16} className="text-emerald-400" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
