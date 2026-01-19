'use client';

import React, { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Zap, User, Upload, Plus, X, Loader2, AlertCircle, Check } from 'lucide-react';
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

const MAX_REVIEWS = 6;

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
  const makerBioFileInputRef = useRef<HTMLInputElement>(null);
  const reviewFileInputRef = useRef<HTMLInputElement>(null);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMakerBio, setIsUploadingMakerBio] = useState(false);
  const [isUploadingReview, setIsUploadingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize config from seller's vibe settings
  const vibeConfig = seller.shopConfig.vibe;
  const [config, setConfig] = useState<VibeFormConfig>({
    spotlight: {
      enabled: vibeConfig?.spotlight?.enabled || false,
      title: vibeConfig?.spotlight?.title || '',
      subtitle: vibeConfig?.spotlight?.subtitle || '',
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

  // Upload image to server
  const uploadImage = async (file: File, type: 'maker-bio' | 'pinned-review'): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch('/api/vibe/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        return result.url;
      } else {
        setError(result.error || t('seller.vibe.uploadError'));
        return null;
      }
    } catch {
      setError(t('seller.vibe.uploadError'));
      return null;
    }
  };

  const handleMakerBioImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setIsUploadingMakerBio(true);
    setError(null);

    const url = await uploadImage(e.target.files[0], 'maker-bio');

    if (url) {
      setConfig((prev) => ({
        ...prev,
        makerBio: { ...prev.makerBio, imageUrl: url },
      }));
    }

    setIsUploadingMakerBio(false);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    if (config.reviews.length >= MAX_REVIEWS) {
      setError(t('seller.vibe.maxReviews'));
      return;
    }

    setIsUploadingReview(true);
    setError(null);

    const url = await uploadImage(e.target.files[0], 'pinned-review');

    if (url) {
      const newReview: ReviewItem = {
        id: `review-${Date.now()}`,
        username: 'customer',
        image: url,
        note: '',
        enabled: true,
      };
      setConfig((prev) => ({ ...prev, reviews: [...prev.reviews, newReview] }));
      setIsAddingReview(false);
    }

    setIsUploadingReview(false);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

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

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || t('seller.vibe.saveError'));
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

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          <Check size={16} />
          {t('seller.vibe.saved')}
        </div>
      )}

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
                {isUploadingMakerBio ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-zinc-400" />
                  </div>
                ) : config.makerBio.imageUrl ? (
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
                    ref={makerBioFileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleMakerBioImageUpload}
                    disabled={isUploadingMakerBio}
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

      {/* Pinned Reviews */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-white">{t('seller.vibe.reviews.pinned')}</h3>
            <p className="text-[10px] text-zinc-500">
              {t('seller.vibe.reviews.showcase')} ({config.reviews.length}/{MAX_REVIEWS})
            </p>
          </div>
          {config.reviews.length < MAX_REVIEWS && (
            <button
              onClick={() => setIsAddingReview(!isAddingReview)}
              disabled={isUploadingReview}
              className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg disabled:opacity-50"
            >
              {isAddingReview ? <X size={16} /> : <Plus size={16} />}
            </button>
          )}
        </div>

        {/* Upload Review Image */}
        {isAddingReview && (
          <div className="mb-4 animate-slide-down">
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
              {isUploadingReview ? (
                <Loader2 size={24} className="animate-spin text-zinc-400 mb-2" />
              ) : (
                <Upload size={24} className="text-zinc-500 mb-2" />
              )}
              <span className="text-sm text-zinc-400">
                {isUploadingReview ? t('seller.vibe.uploading') : t('seller.vibe.reviews.uploadImage')}
              </span>
              <span className="text-[10px] text-zinc-600 mt-1">
                JPG, PNG, WebP (max 5MB)
              </span>
              <input
                type="file"
                ref={reviewFileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleReviewImageUpload}
                disabled={isUploadingReview}
              />
            </label>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-2">
          {config.reviews.length === 0 && !isAddingReview && (
            <div className="text-center py-6 text-zinc-600 text-sm">
              {t('seller.vibe.reviews.empty')}
            </div>
          )}
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
              <div className="flex-1 min-w-0 space-y-1">
                <input
                  type="text"
                  value={review.username}
                  onChange={(e) => {
                    const newReviews = config.reviews.map((r) =>
                      r.id === review.id ? { ...r, username: e.target.value } : r
                    );
                    setConfig((prev) => ({ ...prev, reviews: newReviews }));
                  }}
                  className="w-full bg-transparent text-xs font-bold text-white focus:outline-none"
                  placeholder={t('seller.vibe.reviews.usernamePlaceholder')}
                />
                <input
                  type="text"
                  value={review.note}
                  onChange={(e) => {
                    const newReviews = config.reviews.map((r) =>
                      r.id === review.id ? { ...r, note: e.target.value } : r
                    );
                    setConfig((prev) => ({ ...prev, reviews: newReviews }));
                  }}
                  className="w-full bg-transparent text-[10px] text-zinc-400 focus:text-white focus:outline-none"
                  placeholder={t('seller.vibe.reviews.addNote')}
                />
              </div>
              <button
                onClick={() => {
                  const newReviews = config.reviews.filter((r) => r.id !== review.id);
                  setConfig((prev) => ({ ...prev, reviews: newReviews }));
                }}
                className="p-2 text-zinc-600 hover:text-red-400"
                title={t('seller.vibe.reviews.removeReview')}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
