'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Edit2 } from 'lucide-react';

/**
 * Product interface for inventory
 */
interface InventoryProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  stock: number;
  videoUrl: string;
}

/**
 * Seller Inventory Page
 *
 * Shows all products with quick stock management.
 */
export default function InventoryPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

  // TODO: Fetch from API and integrate with state management
  const [products, setProducts] = useState<InventoryProduct[]>([
    {
      id: '1',
      title: 'Handmade Berber Rug',
      price: 450,
      currency: 'MAD',
      stock: 5,
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    },
    {
      id: '2',
      title: 'Ceramic Vase Collection',
      price: 180,
      currency: 'MAD',
      stock: 12,
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    {
      id: '3',
      title: 'Argan Oil Set',
      price: 280,
      currency: 'MAD',
      stock: 0,
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    {
      id: '4',
      title: 'Leather Pouf Ottoman',
      price: 400,
      currency: 'MAD',
      stock: 3,
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    },
  ]);

  const quickUpdateStock = (productId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, product.stock + delta) }
          : product
      )
    );
  };

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          {t('seller.inventory.title')} <span className="text-zinc-500 text-sm font-normal">({products.length})</span>
        </h2>
        <Link
          href={`/${locale}/seller/inventory/new`}
          className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
        >
          <Plus size={14} /> {t('seller.inventory.addProduct')}
        </Link>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex gap-3"
          >
            <div className="w-16 h-20 bg-black rounded-lg overflow-hidden shrink-0 relative">
              <video
                src={product.videoUrl}
                className="w-full h-full object-cover opacity-80"
                muted
                playsInline
              />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-red-500">{t('seller.inventory.outOfStock')}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-white truncate w-32">{product.title}</h3>
                  <p className="text-xs text-zinc-500">
                    {product.price} {product.currency}
                  </p>
                </div>
                <Link
                  href={`/${locale}/seller/inventory/${product.id}/edit`}
                  className="p-1.5 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                >
                  <Edit2 size={12} />
                </Link>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 bg-black rounded-lg p-1 border border-zinc-800">
                  <button
                    onClick={() => quickUpdateStock(product.id, -1)}
                    className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                  >
                    -
                  </button>
                  <span
                    className={`w-8 text-center text-xs font-bold ${
                      product.stock < 5 ? 'text-red-400' : 'text-white'
                    }`}
                  >
                    {product.stock}
                  </span>
                  <button
                    onClick={() => quickUpdateStock(product.id, 1)}
                    className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                  >
                    +
                  </button>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
