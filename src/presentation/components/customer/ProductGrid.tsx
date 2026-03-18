'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Package } from 'lucide-react';
import { ProductVideo } from '../video/ProductVideo';
import type { Product } from '@/domain/entities/Product';

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (productId: string) => void;
}

export function ProductGrid({ products, onSelectProduct }: ProductGridProps) {
  const t = useTranslations('customer.feed');

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
          <Package size={28} className="text-zinc-600" />
        </div>
        <p className="text-zinc-400 font-medium">{t('noProducts')}</p>
        <p className="text-zinc-600 text-sm mt-1 text-center">{t('noProductsHint')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-px bg-zinc-900">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelectProduct(product.id)}
          className="relative aspect-[3/4] bg-zinc-900 overflow-hidden active:opacity-80 transition-opacity"
        >
          <ProductVideo
            productId={product.id}
            src={product.videoUrl}
            isActive={false}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
          />
        </button>
      ))}
    </div>
  );
}
