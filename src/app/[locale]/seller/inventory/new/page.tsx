'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Instagram, Upload, Loader2, Plus, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { DirectionalIcon } from '@/presentation/components/ui/DirectionalIcon';
import type { ProductCategoryType } from '@/lib/constants';
import { ComingSoonModal } from '@/presentation/components/ui/ComingSoonModal';
import type { InstagramMediaDTO } from '@/application/dtos/InstagramDTO';

interface InstagramMedia {
  id: string;
  url: string;
  thumbnail?: string;
  caption?: string;
  permalink: string;
}

const PRESET_VARIANTS: Record<ProductCategoryType, string[]> = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  jewelry: ['Gold', 'Silver', 'Rose Gold', 'Adjustable'],
  home: ['Small', 'Medium', 'Large', 'Set of 2', 'Set of 4'],
  beauty: ['50ml', '100ml', 'Pack of 1', 'Pack of 3'],
  other: ['Option A', 'Option B'],
};

type Step = 'connect' | 'select' | 'create';

/**
 * New Product Page
 *
 * Multi-step wizard to import from Instagram or upload video and create product.
 */
export default function NewProductPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

  const [step, setStep] = useState<Step>('connect');
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [instagramMedia, setInstagramMedia] = useState<InstagramMedia[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<InstagramMedia | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    discountPrice: '',
    promotionLabel: '',
    stock: '1',
    features: '',
    description: '',
    category: 'clothing' as ProductCategoryType,
    selectedVariants: [] as string[],
  });

  // Check if Instagram is connected on mount
  useEffect(() => {
    checkInstagramConnection();
  }, []);

  const checkInstagramConnection = async () => {
    setIsCheckingConnection(true);
    try {
      // Try to fetch media - if it works, we're connected
      const response = await fetch('/api/instagram/media?limit=1');
      if (response.ok) {
        setIsConnected(true);
        setStep('connect'); // Will show "Fetch My Reels" button
      } else {
        const data = await response.json();
        if (data.needsReconnect) {
          setNeedsReconnect(true);
        }
        setIsConnected(false);
      }
    } catch {
      setIsConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleConnectInstagram = () => {
    // Redirect to OAuth flow
    window.location.href = '/api/auth/instagram';
  };

  const handleFetchMedia = async () => {
    setIsFetching(true);
    setMediaError(null);

    try {
      const response = await fetch('/api/instagram/media?limit=20');
      const data = await response.json();

      if (!response.ok) {
        if (data.needsReconnect) {
          setNeedsReconnect(true);
          setMediaError(t('seller.inventory.instagramReconnectRequired'));
        } else {
          setMediaError(data.error || t('seller.inventory.fetchMediaFailed'));
        }
        return;
      }

      // Filter for videos only and transform to our format
      const videos: InstagramMedia[] = (data.media as InstagramMediaDTO[])
        .filter((m) => m.mediaType === 'VIDEO')
        .map((m) => ({
          id: m.id,
          url: m.mediaUrl || '',
          thumbnail: m.thumbnailUrl,
          caption: m.caption,
          permalink: m.permalink,
        }));

      if (videos.length === 0) {
        setMediaError(t('seller.inventory.noVideosFound'));
        return;
      }

      setInstagramMedia(videos);
      setStep('select');
    } catch {
      setMediaError(t('seller.inventory.fetchMediaFailed'));
    } finally {
      setIsFetching(false);
    }
  };

  const handleSelectMedia = (media: InstagramMedia) => {
    setSelectedMedia(media);
    setFormData((prev) => ({ ...prev, description: media.caption || '' }));
    setStep('create');
  };

  const handleMagicWrite = async () => {
    if (!formData.title || !formData.features) return;
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setFormData((prev) => ({
      ...prev,
      description: `Experience the authentic craftsmanship of Morocco with our ${prev.title}. ${prev.features}. Handcrafted by local artisans with generations of expertise.`,
    }));
    setIsGenerating(false);
  };

  const toggleVariant = (variant: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedVariants: prev.selectedVariants.includes(variant)
        ? prev.selectedVariants.filter((v) => v !== variant)
        : [...prev.selectedVariants, variant],
    }));
  };

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!formData.title || !formData.price) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || `Product: ${formData.title}`,
          price: parseFloat(formData.price),
          discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
          promotionLabel: formData.promotionLabel || undefined,
          stock: parseInt(formData.stock, 10) || 1,
          videoUrl: selectedMedia?.url || undefined,
          instagramMediaId: selectedMedia?.id || undefined,
          category: formData.category,
          variants: formData.selectedVariants.length > 0 ? formData.selectedVariants : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }

      router.push(`/${locale}/seller/inventory`);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Failed to create product');
      setIsPublishing(false);
    }
  };

  const goBack = () => {
    if (step === 'create') setStep('select');
    else if (step === 'select') setStep('connect');
    else router.push(`/${locale}/seller/inventory`);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-zinc-950 text-white">
      {/* Header - Back button fixed on LEFT side regardless of RTL */}
      <div className="relative flex items-center justify-center mb-8 pt-4 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 px-6 py-4 border-b border-zinc-800/50">
        <button onClick={goBack} className="absolute left-4 p-2 text-zinc-400 hover:text-white">
          <DirectionalIcon icon={ArrowLeft} size={24} />
        </button>
        <h1 className="text-2xl font-bold">
          {step === 'connect' && t('seller.inventory.setupDrop')}
          {step === 'select' && t('seller.inventory.selectVideo')}
          {step === 'create' && t('seller.inventory.newProduct')}
        </h1>
      </div>

      <div className="max-w-lg mx-auto p-6 pb-20">
        {/* Step 1: Connect / Fetch */}
        {step === 'connect' && (
          <div className="space-y-6 animate-fade-in">
            {isCheckingConnection ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 size={32} className="animate-spin text-zinc-400" />
                <p className="text-zinc-500 text-sm">{t('common.loading')}</p>
              </div>
            ) : isConnected ? (
              /* Instagram is connected - show fetch button */
              <>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Instagram size={32} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{t('seller.inventory.importFromInstagram')}</h2>
                  <p className="text-zinc-400 text-sm">{t('seller.inventory.selectFromReels')}</p>
                </div>

                {/* Error Message */}
                {mediaError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    <span>{mediaError}</span>
                  </div>
                )}

                <button
                  onClick={handleFetchMedia}
                  disabled={isFetching}
                  className="w-full bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  {isFetching ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <RefreshCw size={18} />
                  )}
                  {t('seller.inventory.fetchMyReels')}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-950 px-2 text-zinc-600 font-bold">{t('common.or')}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowComingSoon(true)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold py-3 rounded-xl hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={18} /> {t('seller.inventory.uploadVideo')}
                </button>
              </>
            ) : (
              /* Instagram not connected - show connect button */
              <>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Instagram size={32} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{t('seller.inventory.importFromInstagram')}</h2>
                  <p className="text-zinc-400 text-sm">
                    {needsReconnect
                      ? t('seller.inventory.instagramReconnectRequired')
                      : t('seller.inventory.connectInstagramFirst')}
                  </p>
                </div>

                <button
                  onClick={handleConnectInstagram}
                  className="w-full bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Instagram size={18} />
                  {needsReconnect
                    ? t('seller.settings.instagram.reconnect')
                    : t('seller.settings.instagram.connectWithInstagram')}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-950 px-2 text-zinc-600 font-bold">{t('common.or')}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowComingSoon(true)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold py-3 rounded-xl hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={18} /> {t('seller.inventory.uploadVideo')}
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 2: Select Video */}
        {step === 'select' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-zinc-400">{t('seller.inventory.selectVideoHint')}</p>
            {instagramMedia.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500">{t('seller.inventory.noVideosFound')}</p>
                <button
                  onClick={() => setStep('connect')}
                  className="mt-4 text-emerald-400 text-sm hover:underline"
                >
                  {t('common.goBack')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {instagramMedia.map((media) => (
                  <div
                    key={media.id}
                    onClick={() => handleSelectMedia(media)}
                    className="relative aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-emerald-500 group"
                  >
                    {media.thumbnail ? (
                      <img
                        src={media.thumbnail}
                        alt={media.caption || 'Instagram video'}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        muted
                        playsInline
                      />
                    )}
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-[10px] text-white line-clamp-2">{media.caption || t('seller.inventory.noCaption')}</p>
                    </div>
                    <div className="absolute top-2 end-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={14} className="text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Create Product */}
        {step === 'create' && selectedMedia && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex gap-4 items-start">
              <div className="w-20 h-28 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 shrink-0">
                <video src={selectedMedia.url} className="w-full h-full object-cover" muted />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">{t('product.title')}</label>
                  <input
                    type="text"
                    placeholder={t('seller.inventory.productTitle')}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">{t('product.price')}</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">{t('product.stock')}</label>
                    <input
                      type="number"
                      placeholder="1"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1 flex justify-between">
                <span>{t('product.description')}</span>
                <span
                  className="text-emerald-500 flex items-center gap-1 cursor-pointer"
                  onClick={handleMagicWrite}
                >
                  {isGenerating ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Sparkles size={10} />
                  )}
                  {t('seller.inventory.magicWrite')}
                </span>
              </label>
              <textarea
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                placeholder={t('seller.inventory.descriptionPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <input
                type="text"
                placeholder={t('seller.inventory.keyFeatures')}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:text-white"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              />
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1 mb-2 block">
                  {t('product.category')}
                </label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {(['clothing', 'shoes', 'jewelry', 'beauty', 'home', 'other'] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap transition-colors ${
                          formData.category === cat
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {t(`product.categories.${cat}`)}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1 mb-2 block">
                  {t('product.variants')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_VARIANTS[formData.category]?.map((variant) => (
                    <button
                      key={variant}
                      onClick={() => toggleVariant(variant)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        formData.selectedVariants.includes(variant)
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {publishError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {publishError}
              </div>
            )}

            <div className="pt-6">
              <button
                onClick={handlePublish}
                disabled={!formData.title || !formData.price || isPublishing}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Plus size={20} />
                )}{' '}
                {isPublishing ? t('common.saving') : t('seller.inventory.publishDrop')}
              </button>
            </div>
          </div>
        )}
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        featureName={t('seller.inventory.uploadVideo')}
      />
    </div>
  );
}
