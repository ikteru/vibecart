'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Plus, Edit2 } from 'lucide-react';
import { ProductVideo } from '../video/ProductVideo';
import type { ProductResponseDTO } from '@/application/dtos/ProductDTO';

interface InventoryListProps {
  initialProducts: ProductResponseDTO[];
  locale: string;
  updateStockAction: (productId: string, newStock: number) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Inventory List Client Component
 *
 * Displays products with quick stock management.
 * Receives real product data from server component.
 */
export function InventoryList({ initialProducts, locale, updateStockAction }: InventoryListProps) {
  const t = useTranslations();
  const [products, setProducts] = useState(initialProducts);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const quickUpdateStock = async (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, product.stock + delta);
    if (newStock === product.stock) return;

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock, isInStock: newStock > 0, hasLowStock: newStock > 0 && newStock < 5 } : p))
    );
    setUpdatingId(productId);

    startTransition(async () => {
      const result = await updateStockAction(productId, newStock);
      if (!result.success) {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: product.stock, isInStock: product.isInStock, hasLowStock: product.hasLowStock } : p))
        );
      }
      setUpdatingId(null);
    });
  };

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          {t('seller.inventory.title')}{' '}
          <span className="text-zinc-500 text-sm font-normal">({products.length})</span>
        </h2>
        <Link
          href={`/${locale}/seller/inventory/new`}
          className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
        >
          <Plus size={14} /> {t('seller.inventory.addProduct')}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-zinc-500 text-sm">{t('seller.inventory.noProducts')}</p>
          <Link
            href={`/${locale}/seller/inventory/new`}
            className="inline-flex items-center gap-1 mt-4 text-emerald-400 text-sm hover:underline"
          >
            <Plus size={14} /> {t('seller.inventory.addFirstProduct')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex gap-3"
            >
              <div className="w-16 h-20 bg-black rounded-lg overflow-hidden shrink-0 relative">
                {product.videoUrl ? (
                  <ProductVideo
                    productId={product.id}
                    src={product.videoUrl}
                    className="w-full h-full object-cover opacity-80"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">
                    {t('seller.inventory.noVideo')}
                  </div>
                )}
                {!product.isInStock && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-red-500">
                      {t('seller.inventory.outOfStock')}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-white truncate w-32">{product.title}</h3>
                    <p className="text-xs text-zinc-500">
                      {product.effectivePrice.amount} {t('currency.MAD_symbol')}
                      {product.hasDiscount && (
                        <span className="line-through text-zinc-600 ms-1">
                          {product.price.amount}
                        </span>
                      )}
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
                      disabled={isPending && updatingId === product.id}
                      className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded disabled:opacity-50"
                    >
                      -
                    </button>
                    <span
                      className={`w-8 text-center text-xs font-bold ${
                        product.hasLowStock ? 'text-red-400' : 'text-white'
                      }`}
                    >
                      {product.stock}
                    </span>
                    <button
                      onClick={() => quickUpdateStock(product.id, 1)}
                      disabled={isPending && updatingId === product.id}
                      className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      product.isInStock ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
