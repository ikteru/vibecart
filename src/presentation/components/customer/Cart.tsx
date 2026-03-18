'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import type { CartItem } from '@/presentation/hooks/useCart';

interface CartProps {
  items: CartItem[];
  subtotal: number;
  currency?: string;
  onUpdateQuantity: (productId: string, quantity: number, variant?: string) => void;
  onRemove: (productId: string, variant?: string) => void;
  onCheckout: () => void;
}

export function Cart({
  items,
  subtotal,
  currency = 'MAD',
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: CartProps) {
  const t = useTranslations('customer.cart');

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <ShoppingBag size={28} className="text-zinc-500" />
        </div>
        <p className="text-zinc-400 font-medium">{t('empty')}</p>
        <p className="text-zinc-600 text-sm mt-2">{t('emptyHint')}</p>
      </div>
    );
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-black pb-40">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3">
        <h1 className="text-white font-bold text-lg">{t('title')}</h1>
        <p className="text-zinc-500 text-xs mt-0.5">
          {t('itemCount', { count: itemCount })}
        </p>
      </div>

      {/* Cart items */}
      <div className="px-4 pt-3 space-y-3">
        {items.map((item) => {
          const effectivePrice = item.discountPrice ?? item.price;
          const lineTotal = effectivePrice * item.quantity;

          return (
            <div
              key={`${item.productId}-${item.variant || ''}`}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                {item.thumbnail ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
                    <video
                      src={item.thumbnail}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={20} className="text-zinc-600" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm line-clamp-2">
                    {item.title}
                  </h3>
                  {item.variant && (
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {t('variant')}: {item.variant}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    {item.discountPrice ? (
                      <>
                        <span className="text-emerald-400 font-bold text-sm">
                          {(effectivePrice / 100).toFixed(0)} {currency}
                        </span>
                        <span className="text-zinc-500 line-through text-xs">
                          {(item.price / 100).toFixed(0)}
                        </span>
                      </>
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {(effectivePrice / 100).toFixed(0)} {currency}
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => onRemove(item.productId, item.variant)}
                  className="text-zinc-500 hover:text-red-400 transition-colors self-start p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.productId, item.quantity - 1, item.variant)
                    }
                    className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-white font-bold text-sm w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      onUpdateQuantity(
                        item.productId,
                        Math.min(item.quantity + 1, item.stock),
                        item.variant
                      )
                    }
                    disabled={item.quantity >= item.stock}
                    className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-white font-bold text-sm">
                  {(lineTotal / 100).toFixed(0)} {currency}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price summary + checkout - fixed at bottom */}
      <div className="fixed bottom-16 inset-x-0 z-40 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 p-4 safe-area-pb">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-zinc-400 text-sm">{t('subtotal')}</span>
            <span className="text-white font-medium text-sm">
              {(subtotal / 100).toFixed(0)} {currency}
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-sm">{t('shipping')}</span>
            <span className="text-zinc-500 text-sm">{t('shippingEstimate')}</span>
          </div>
          <div className="flex items-center justify-between mb-4 pt-2 border-t border-zinc-800">
            <span className="text-white font-bold">{t('total')}</span>
            <span className="text-white font-bold text-lg">
              {(subtotal / 100).toFixed(0)} {currency}
            </span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {t('proceedToCheckout')}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
