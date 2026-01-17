'use client';

import React, { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Zap, User, Upload, Plus, X, Loader2 } from 'lucide-react';
import { ComingSoonModal } from '@/presentation/components/ui/ComingSoonModal';
import type { SellerResponseDTO, UpdateSellerDTO } from '@/application/dtos/SellerDTO';
import type { VibeConfig, PinnedReview } from '@/domain/entities/Seller';

// Local review interface with enabled state for UI
interface ReviewItem extends PinnedReview {
  enabled: boolean;
}

interface VibeFormConfig {
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
  reviews: ReviewItem[];
}

const MOCK_ARCHIVED_STORIES = [
  {
    id: 's1',
    url: 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=400&q=80',
    date: '2h ago',
  },
  {
    id: 's2',
    url: 'https://images.unsplash.com/photo-1528913753736-2313fa43cb8d?w=400&q=80',
    date: '5h ago',
  },
  {
    id: 's3',
    url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80',
    date: '1d ago',
  },
  {
    id: 's4',
    url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
    date: '2d ago',
  },
];

interface VibeFormProps {
  seller: SellerResponseDTO;
  updateAction: (data: UpdateSellerDTO) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Vibe Form Client Component
 *
 * Handles vibe/appearance editing with real data.
 */
export function VibeForm({ seller, updateAction }: VibeFormProps) {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSelectingStory, setIsSelectingStory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Initialize config from seller's vibe settings
  const vibeConfig = seller.shopConfig.vibe;
  const [config, setConfig] = useState<VibeFormConfig>({
    spotlight: {
      enabled: vibeConfig?.spotlight?.enabled || false,
      title: vibeConfig?.spotlight?.title || 'Winter Sale',
      subtitle: vibeConfig?.spotlight?.subtitle || 'Up to 50% Off',
      color: vibeConfig?.spotlight?.color || 'from-orange-500 to-red-600',
    },
    makerBio: {
      enabled: vibeConfig?.makerBio?.enabled || false,
      name: vibeConfig?.makerBio?.name || '',
      role: vibeConfig?.makerBio?.role || '',
      bio: vibeConfig?.makerBio?.bio || '',
      imageUrl: vibeConfig?.makerBio?.imageUrl || '',
    },
    reviews: (vibeConfig?.pinnedReviews || []).map((r) => ({ ...r, enabled: true })),
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setConfig((prev) => ({
        ...prev,
        makerBio: { ...prev.makerBio, imageUrl },
      }));
    }
  };

  const handleSelectStory = (storyUrl: string) => {
    const newReview: ReviewItem = {
      id: `story-${Date.now()}`,
      username: 'customer_love',
      image: storyUrl,
      note: 'Customer Love',
      enabled: true,
    };
    setConfig((prev) => ({ ...prev, reviews: [...prev.reviews, newReview] }));
    setIsSelectingStory(false);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const vibeData: VibeConfig = {
      spotlight: config.spotlight,
      makerBio: config.makerBio,
      pinnedReviews: config.reviews.map(({ id, username, image, note }) => ({
        id,
        username,
        image,
        note,
      })),
    };

    const updateData: UpdateSellerDTO = {
      shopConfig: {
        vibe: vibeData,
      },
    };

    const result = await updateAction(updateData);
    setIsSaving(false);

    if (!result.success) {
      setShowComingSoon(true);
    }
  };

  return (
    <div className="animate-fade-in pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{t('seller.vibe.title')}</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-50 flex items-center gap-1"
        >
          {isSaving && <Loader2 size={12} className="animate-spin" />}
          {t('seller.vibe.saveChanges')}
        </button>
      </div>

      {/* Spotlight / Offers */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-500">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{t('seller.vibe.spotlight.offer')}</h3>
              <p className="text-[10px] text-zinc-500">{t('seller.vibe.spotlight.featuredCard')}</p>
            </div>
          </div>
          <button
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                spotlight: { ...prev.spotlight, enabled: !prev.spotlight.enabled },
              }))
            }
            className={`w-10 h-6 rounded-full transition-colors relative ${
              config.spotlight.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                config.spotlight.enabled ? 'start-5' : 'start-1'
              }`}
            />
          </button>
        </div>
        {config.spotlight.enabled && (
          <div className="space-y-2">
            <input
              type="text"
              value={config.spotlight.title}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  spotlight: { ...prev.spotlight, title: e.target.value },
                }))
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              placeholder={t('seller.vibe.spotlight.titlePlaceholder')}
            />
            <input
              type="text"
              value={config.spotlight.subtitle}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  spotlight: { ...prev.spotlight, subtitle: e.target.value },
                }))
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              placeholder={t('seller.vibe.spotlight.subtitlePlaceholder')}
            />
          </div>
        )}
      </div>

      {/* Maker Bio */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
              <User size={20} className="text-zinc-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{t('seller.vibe.makerBio.title')}</h3>
              <p className="text-[10px] text-zinc-500">{t('seller.vibe.makerBio.personalize')}</p>
            </div>
          </div>
          <button
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                makerBio: { ...prev.makerBio, enabled: !prev.makerBio.enabled },
              }))
            }
            className={`w-10 h-6 rounded-full transition-colors relative ${
              config.makerBio.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                config.makerBio.enabled ? 'start-5' : 'start-1'
              }`}
            />
          </button>
        </div>

        {config.makerBio.enabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full bg-black border border-zinc-800 overflow-hidden group">
                {config.makerBio.imageUrl ? (
                  <img
                    src={config.makerBio.imageUrl}
                    className="w-full h-full object-cover"
                    alt="Maker"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <User size={24} />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Upload size={16} className="text-white" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder={t('seller.vibe.makerBio.name')}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  value={config.makerBio.name}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      makerBio: { ...prev.makerBio, name: e.target.value },
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder={t('seller.vibe.makerBio.rolePlaceholder')}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  value={config.makerBio.role}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      makerBio: { ...prev.makerBio, role: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <textarea
              rows={2}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none"
              placeholder={t('seller.vibe.makerBio.bioPlaceholder')}
              value={config.makerBio.bio}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  makerBio: { ...prev.makerBio, bio: e.target.value },
                }))
              }
            />
          </div>
        )}
      </div>

      {/* Reviews / Stories Selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-white">{t('seller.vibe.reviews.pinned')}</h3>
            <p className="text-[10px] text-zinc-500">{t('seller.vibe.reviews.showcase')}</p>
          </div>
          <button
            onClick={() => setIsSelectingStory(!isSelectingStory)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg"
          >
            {isSelectingStory ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {isSelectingStory && (
          <div className="grid grid-cols-4 gap-2 mb-4 animate-slide-down">
            {MOCK_ARCHIVED_STORIES.map((story) => (
              <button
                key={story.id}
                onClick={() => handleSelectStory(story.url)}
                className="aspect-[9/16] rounded-lg overflow-hidden border border-zinc-800 hover:border-emerald-500 transition-colors relative"
              >
                <img src={story.url} className="w-full h-full object-cover" alt="Story" />
                <div className="absolute inset-0 bg-black/20" />
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {config.reviews.map((review) => (
            <div
              key={review.id}
              className="flex items-center gap-3 bg-black p-2 rounded-xl border border-zinc-800"
            >
              <img
                src={review.image}
                className="w-8 h-12 rounded bg-zinc-800 object-cover"
                alt="Review"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">@{review.username}</p>
                <input
                  type="text"
                  value={review.note}
                  onChange={(e) => {
                    const newReviews = config.reviews.map((r) =>
                      r.id === review.id ? { ...r, note: e.target.value } : r
                    );
                    setConfig((prev) => ({ ...prev, reviews: newReviews }));
                  }}
                  className="w-full bg-transparent text-[10px] text-zinc-400 focus:text-white focus:outline-none mt-0.5"
                  placeholder={t('seller.vibe.reviews.addNote')}
                />
              </div>
              <button
                onClick={() => {
                  const newReviews = config.reviews.filter((r) => r.id !== review.id);
                  setConfig((prev) => ({ ...prev, reviews: newReviews }));
                }}
                className="p-2 text-zinc-600 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        featureName={t('seller.vibe.title')}
      />
    </div>
  );
}
