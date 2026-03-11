'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Trash2 } from 'lucide-react';
import type { SavedProduct } from '@/presentation/hooks/useSaved';

interface SavedProductsProps {
  saved: SavedProduct[];
  onRemove: (productId: string) => void;
  onTap: (productId: string) => void;
}

export function SavedProducts({ saved, onRemove, onTap }: SavedProductsProps) {
  const t = useTranslations('customer.saved');
  const [editMode, setEditMode] = useState(false);

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <Heart size={28} className="text-zinc-500" />
        </div>
        <p className="text-zinc-400 font-medium">{t('empty')}</p>
        <p className="text-zinc-600 text-sm mt-2">{t('emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">{t('title')}</h1>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-sm text-emerald-400 font-medium"
          >
            {editMode ? t('done') : t('edit')}
          </button>
        </div>
        <p className="text-zinc-500 text-xs mt-0.5">
          {t('itemCount', { count: saved.length })}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-3">
        {saved.map((item) => (
          <button
            key={item.productId}
            onClick={() => !editMode && onTap(item.productId)}
            className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 text-start"
          >
            {item.thumbnail ? (
              <div className="aspect-[4/5] bg-zinc-800">
                <video
                  src={item.thumbnail}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              </div>
            ) : (
              <div className="aspect-[4/5] bg-zinc-800 flex items-center justify-center">
                <Heart size={24} className="text-zinc-600" />
              </div>
            )}

            <div className="p-3">
              <p className="text-white text-sm font-medium line-clamp-1">{item.title}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {item.discountPrice ? (
                  <>
                    <span className="text-emerald-400 font-bold text-sm">
                      {(item.discountPrice / 100).toFixed(0)} {item.currency}
                    </span>
                    <span className="text-zinc-500 line-through text-xs">
                      {(item.price / 100).toFixed(0)}
                    </span>
                  </>
                ) : (
                  <span className="text-white font-bold text-sm">
                    {(item.price / 100).toFixed(0)} {item.currency}
                  </span>
                )}
              </div>
            </div>

            {/* Edit mode delete button */}
            {editMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.productId);
                }}
                className="absolute top-2 end-2 w-8 h-8 rounded-full bg-red-500/90 flex items-center justify-center z-10"
              >
                <Trash2 size={14} className="text-white" />
              </button>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
