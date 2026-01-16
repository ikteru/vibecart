'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Instagram, Upload, Loader2, Plus, Check, Sparkles } from 'lucide-react';
import type { ProductCategoryType } from '@/lib/constants';

/**
 * Mock Instagram media for demo
 */
const MOCK_IG_MEDIA = [
  {
    id: 'ig1',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=300&q=80',
    caption: 'New Rugs in stock!',
  },
  {
    id: 'ig2',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&q=80',
    caption: 'Handmade ceramics',
  },
  {
    id: 'ig3',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80',
    caption: 'Argan oil magic',
  },
  {
    id: 'ig4',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80',
    caption: 'Leather bags',
  },
];

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

  const [step, setStep] = useState<Step>('connect');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<(typeof MOCK_IG_MEDIA)[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleConnectInstagram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instagramHandle) return;
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setStep('select');
    }, 2000);
  };

  const handleSelectMedia = (media: (typeof MOCK_IG_MEDIA)[0]) => {
    setSelectedMedia(media);
    setFormData((prev) => ({ ...prev, description: media.caption }));
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

  const handlePublish = () => {
    // TODO: Save to API
    console.log('Publishing product:', { ...formData, videoUrl: selectedMedia?.url });
    router.push(`/${locale}/seller/inventory`);
  };

  const goBack = () => {
    if (step === 'create') setStep('select');
    else if (step === 'select') setStep('connect');
    else router.push(`/${locale}/seller/inventory`);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-zinc-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-4 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 px-6 py-4 border-b border-zinc-800/50">
        <button onClick={goBack} className="p-2 -ml-2 text-zinc-400 hover:text-white">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">
          {step === 'connect' && 'Setup Drop'}
          {step === 'select' && 'Select Video'}
          {step === 'create' && 'New Product'}
        </h1>
      </div>

      <div className="max-w-lg mx-auto p-6 pb-20">
        {/* Step 1: Connect */}
        {step === 'connect' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Instagram size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Import from Instagram</h2>
              <p className="text-zinc-400 text-sm">Enter your handle to fetch your latest Reels.</p>
            </div>

            <form onSubmit={handleConnectInstagram} className="space-y-4">
              <input
                type="text"
                placeholder="@username"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
              />
              <button
                type="submit"
                disabled={!instagramHandle || isConnecting}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isConnecting ? <Loader2 size={18} className="animate-spin" /> : 'Fetch Media'}
              </button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-950 px-2 text-zinc-600 font-bold">Or</span>
              </div>
            </div>

            <button className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold py-3 rounded-xl hover:text-white transition-colors flex items-center justify-center gap-2">
              <Upload size={18} /> Upload Video File
            </button>
          </div>
        )}

        {/* Step 2: Select Video */}
        {step === 'select' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-zinc-400">Select a video to turn into a product.</p>
            <div className="grid grid-cols-2 gap-3">
              {MOCK_IG_MEDIA.map((media) => (
                <div
                  key={media.id}
                  onClick={() => handleSelectMedia(media)}
                  className="relative aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-emerald-500 group"
                >
                  <video
                    src={media.url}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    muted
                    loop
                    playsInline
                  />
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[10px] text-white line-clamp-2">{media.caption}</p>
                  </div>
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={14} className="text-white" />
                  </div>
                </div>
              ))}
            </div>
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
                  <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Title</label>
                  <input
                    type="text"
                    placeholder="Product Name"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Price</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Stock</label>
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
              <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1 flex justify-between">
                <span>Description</span>
                <span
                  className="text-emerald-500 flex items-center gap-1 cursor-pointer"
                  onClick={handleMagicWrite}
                >
                  {isGenerating ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Sparkles size={10} />
                  )}
                  Magic Write
                </span>
              </label>
              <textarea
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Product description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <input
                type="text"
                placeholder="Key features for AI (e.g. Organic, Handmade)"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:text-white"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              />
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1 mb-2 block">
                  Category
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
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1 mb-2 block">
                  Variants
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

            <div className="pt-6">
              <button
                onClick={handlePublish}
                disabled={!formData.title || !formData.price}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Publish Drop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
