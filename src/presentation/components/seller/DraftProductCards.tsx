'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Play, Loader2, Check } from 'lucide-react';

interface DraftProduct {
  id: string;
  title: string;
  price: number; // in centimes
  category: string;
  videoUrl: string;
}

interface DraftProductCardsProps {
  drafts: DraftProduct[];
  onPublish: (productId: string, data: { title: string; price: number; category: string }) => Promise<{ success: boolean; error?: string }>;
  onPublishAll: () => Promise<{ success: boolean; count: number; error?: string }>;
  onImportReels: () => Promise<{ success: boolean; imported: number; error?: string }>;
  hasInstagram: boolean;
}

const CATEGORIES = ['clothing', 'shoes', 'jewelry', 'beauty', 'home', 'other'] as const;

/**
 * DraftProductCards
 *
 * Shows draft products (from Instagram reel imports) as editable cards.
 * Each card has inline title, price, category editing and a publish button.
 */
export function DraftProductCards({
  drafts: initialDrafts,
  onPublish,
  onPublishAll,
  onImportReels,
  hasInstagram,
}: DraftProductCardsProps) {
  const t = useTranslations('seller.dashboard.drafts');
  const [drafts, setDrafts] = useState(initialDrafts);
  const [editState, setEditState] = useState<Record<string, { title: string; price: string; category: string }>>({});
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  const [isImporting, startImporting] = useTransition();
  const [isPublishingAll, startPublishingAll] = useTransition();

  const getEditState = (draft: DraftProduct) => {
    return editState[draft.id] || {
      title: draft.title,
      price: String(draft.price / 100),
      category: draft.category,
    };
  };

  const updateEditState = (id: string, field: string, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...getEditState(drafts.find((d) => d.id === id)!),
        [field]: value,
      },
    }));
  };

  const handlePublish = async (draft: DraftProduct) => {
    const state = getEditState(draft);
    const price = Math.round(parseFloat(state.price) * 100);

    if (!state.title.trim() || isNaN(price) || price <= 0) return;

    setPublishingIds((prev) => new Set(prev).add(draft.id));
    const result = await onPublish(draft.id, {
      title: state.title,
      price,
      category: state.category,
    });

    if (result.success) {
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    }
    setPublishingIds((prev) => {
      const next = new Set(prev);
      next.delete(draft.id);
      return next;
    });
  };

  const handleImport = () => {
    startImporting(async () => {
      const result = await onImportReels();
      if (result.success && result.imported > 0) {
        // Reload page to show new drafts
        window.location.reload();
      }
    });
  };

  const handlePublishAll = () => {
    startPublishingAll(async () => {
      const result = await onPublishAll();
      if (result.success) {
        setDrafts([]);
      }
    });
  };

  if (drafts.length === 0 && !hasInstagram) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{t('title')}</h3>
        <div className="flex gap-2">
          {hasInstagram && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-400 text-xs font-medium hover:bg-pink-500/20 transition-colors disabled:opacity-50"
            >
              {isImporting ? <Loader2 size={12} className="animate-spin" /> : null}
              {isImporting ? t('importing') : t('importReels')}
            </button>
          )}
          {drafts.length > 1 && (
            <button
              onClick={handlePublishAll}
              disabled={isPublishingAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {isPublishingAll ? <Loader2 size={12} className="animate-spin" /> : null}
              {t('publishAll')}
            </button>
          )}
        </div>
      </div>

      {drafts.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-4">{t('noDrafts')}</p>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => {
            const state = getEditState(draft);
            const isPublishing = publishingIds.has(draft.id);

            return (
              <div key={draft.id} className="flex gap-3 bg-black/40 rounded-xl p-3">
                {/* Video Thumbnail */}
                <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                  <video
                    src={draft.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play size={14} className="text-white" />
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    type="text"
                    value={state.title}
                    onChange={(e) => updateEditState(draft.id, 'title', e.target.value)}
                    placeholder={t('setTitle')}
                    className="w-full bg-transparent border-b border-zinc-700 text-sm text-white pb-1 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={state.price}
                        onChange={(e) => updateEditState(draft.id, 'price', e.target.value)}
                        placeholder={t('setPrice')}
                        className="w-20 bg-transparent border-b border-zinc-700 text-xs text-white pb-1 focus:outline-none focus:border-emerald-500"
                        min="0"
                        step="1"
                      />
                      <span className="text-[10px] text-zinc-500">DH</span>
                    </div>
                    <select
                      value={state.category}
                      onChange={(e) => updateEditState(draft.id, 'category', e.target.value)}
                      className="bg-transparent border-b border-zinc-700 text-xs text-zinc-400 pb-1 focus:outline-none focus:border-emerald-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Publish Button */}
                <button
                  onClick={() => handlePublish(draft)}
                  disabled={isPublishing}
                  className="self-center px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium disabled:opacity-50 shrink-0"
                >
                  {isPublishing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
