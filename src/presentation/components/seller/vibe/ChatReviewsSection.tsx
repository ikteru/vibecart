'use client';

import React, { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Plus, X, Loader2, Upload } from 'lucide-react';
import type { ChatReview, ChatPlatform } from '@/domain/entities/Seller';
import { PhoneMockup } from './PhoneMockup';

const MAX_CHAT_REVIEWS = 6;

interface ChatReviewItem extends ChatReview {
  enabled: boolean;
}

interface ChatReviewsSectionProps {
  reviews: ChatReviewItem[];
  onReviewsChange: (reviews: ChatReviewItem[]) => void;
  uploadImage: (file: File, type: 'chat-screenshot') => Promise<string | null>;
  onError: (error: string) => void;
}

/**
 * Chat Reviews Section Component
 *
 * Allows sellers to upload WhatsApp/Instagram chat screenshots
 * as social proof reviews displayed in phone mockups.
 */
export function ChatReviewsSection({
  reviews,
  onReviewsChange,
  uploadImage,
  onError,
}: ChatReviewsSectionProps) {
  const t = useTranslations('seller.vibe.chatReviews');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<ChatPlatform>('whatsapp');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    if (reviews.length >= MAX_CHAT_REVIEWS) {
      onError(t('maxReached'));
      return;
    }

    const file = e.target.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError(t('invalidFile'));
      return;
    }

    setIsUploading(true);

    const url = await uploadImage(file, 'chat-screenshot');

    if (url) {
      const newReview: ChatReviewItem = {
        id: `chat-${Date.now()}`,
        platform: selectedPlatform,
        screenshotUrl: url,
        customerName: '',
        createdAt: new Date().toISOString(),
        enabled: true,
      };
      onReviewsChange([...reviews, newReview]);
      setIsAdding(false);
    } else {
      onError(t('uploadError'));
    }

    setIsUploading(false);
    e.target.value = '';
  };

  const handleRemoveReview = (id: string) => {
    onReviewsChange(reviews.filter((r) => r.id !== id));
  };

  const handleUpdateCustomerName = (id: string, name: string) => {
    onReviewsChange(
      reviews.map((r) => (r.id === id ? { ...r, customerName: name } : r))
    );
  };

  const handleUpdatePlatform = (id: string, platform: ChatPlatform) => {
    onReviewsChange(
      reviews.map((r) => (r.id === id ? { ...r, platform } : r))
    );
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">{t('title')}</h3>
            <p className="text-[10px] text-zinc-500">
              {t('description')} ({reviews.length}/{MAX_CHAT_REVIEWS})
            </p>
          </div>
        </div>
        {reviews.length < MAX_CHAT_REVIEWS && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            disabled={isUploading}
            className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg disabled:opacity-50"
          >
            {isAdding ? <X size={16} /> : <Plus size={16} />}
          </button>
        )}
      </div>

      {/* Upload Area */}
      {isAdding && (
        <div className="mb-4 animate-slide-down space-y-3">
          {/* Platform Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPlatform('whatsapp')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${
                selectedPlatform === 'whatsapp'
                  ? 'bg-[#075e54]/20 border-[#075e54] text-[#25D366]'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              <span className="text-xs font-medium">{t('whatsapp')}</span>
            </button>
            <button
              onClick={() => setSelectedPlatform('instagram')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${
                selectedPlatform === 'instagram'
                  ? 'bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-orange-400/20 border-pink-500 text-pink-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
              </svg>
              <span className="text-xs font-medium">{t('instagram')}</span>
            </button>
          </div>

          {/* File Upload */}
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-colors">
            {isUploading ? (
              <Loader2 size={24} className="animate-spin text-zinc-400 mb-2" />
            ) : (
              <Upload size={24} className="text-zinc-500 mb-2" />
            )}
            <span className="text-sm text-zinc-400">
              {isUploading ? 'Uploading...' : t('uploadScreenshot')}
            </span>
            <span className="text-[10px] text-zinc-600 mt-1">
              JPG, PNG, WebP (max 5MB)
            </span>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {/* Reviews Grid */}
      <div className="space-y-3">
        {reviews.length === 0 && !isAdding && (
          <div className="text-center py-6 text-zinc-600 text-sm">
            {t('empty')}
          </div>
        )}

        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex gap-3 bg-black p-3 rounded-xl border border-zinc-800"
          >
            {/* Phone Preview (small) */}
            <div className="w-20 flex-shrink-0">
              <PhoneMockup
                platform={review.platform}
                screenshotUrl={review.screenshotUrl}
                customerName={review.customerName || 'Customer'}
                className="w-full"
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Platform Selector */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleUpdatePlatform(review.id, 'whatsapp')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    review.platform === 'whatsapp'
                      ? 'bg-[#075e54] text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {t('whatsapp')}
                </button>
                <button
                  onClick={() => handleUpdatePlatform(review.id, 'instagram')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    review.platform === 'instagram'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {t('instagram')}
                </button>
              </div>

              {/* Customer Name Input */}
              <input
                type="text"
                value={review.customerName}
                onChange={(e) => handleUpdateCustomerName(review.id, e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                placeholder={t('customerNamePlaceholder')}
              />
            </div>

            {/* Delete Button */}
            <button
              onClick={() => handleRemoveReview(review.id)}
              className="p-2 text-zinc-600 hover:text-red-400 self-start"
              title={t('removeReview')}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { ChatReviewItem };
