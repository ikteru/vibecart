'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, Save, Trash2, Sparkles } from 'lucide-react';
import { DirectionalIcon } from '@/presentation/components/ui/DirectionalIcon';
import { ProductVideo } from '@/presentation/components/video/ProductVideo';
import type { ProductResponseDTO, UpdateProductDTO } from '@/application/dtos/ProductDTO';
import type { ProductCategoryType } from '@/lib/constants';

const PRESET_VARIANTS: Record<ProductCategoryType, string[]> = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  jewelry: ['Gold', 'Silver', 'Rose Gold', 'Adjustable'],
  home: ['Small', 'Medium', 'Large', 'Set of 2', 'Set of 4'],
  beauty: ['50ml', '100ml', 'Pack of 1', 'Pack of 3'],
  other: ['Option A', 'Option B'],
};

interface ProductEditFormProps {
  product: ProductResponseDTO;
  locale: string;
  updateAction: (data: UpdateProductDTO) => Promise<{ success: boolean; error?: string }>;
  deleteAction: () => Promise<{ success: boolean; error?: string }>;
}

/**
 * Product Edit Form Client Component
 *
 * Handles editing product details with real data.
 */
export function ProductEditForm({ product, locale, updateAction, deleteAction }: ProductEditFormProps) {
  const router = useRouter();
  const t = useTranslations();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: product.title,
    price: String(product.price.amount),
    stock: String(product.stock),
    description: product.description,
    features: '', // Extract from description or leave empty
    category: product.category,
    selectedVariants: product.variants,
    discountPrice: product.discountPrice ? String(product.discountPrice.amount) : '',
    promotionLabel: product.promotionLabel || '',
  });

  const handleMagicWrite = async () => {
    if (!formData.title || !formData.features) return;
    setIsGenerating(true);
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

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    const updateData: UpdateProductDTO = {
      title: formData.title,
      description: formData.description,
      price: parseInt(formData.price, 10),
      stock: parseInt(formData.stock, 10),
      category: formData.category,
      variants: formData.selectedVariants,
      discountPrice: formData.discountPrice ? parseInt(formData.discountPrice, 10) : null,
      promotionLabel: formData.promotionLabel || null,
    };

    const result = await updateAction(updateData);
    setIsSaving(false);

    if (result.success) {
      router.push(`/${locale}/seller/inventory`);
    } else {
      setError(result.error || t('errors.serverError'));
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('common.confirmDelete'))) return;

    setError(null);
    setIsDeleting(true);
    const result = await deleteAction();
    setIsDeleting(false);

    if (result.success) {
      router.push(`/${locale}/seller/inventory`);
    } else {
      setError(result.error || t('errors.serverError'));
    }
  };

  const goBack = () => {
    router.push(`/${locale}/seller/inventory`);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-zinc-950 text-white">
      {/* Header */}
      <div className="relative flex items-center justify-center mb-8 pt-4 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 px-6 py-4 border-b border-zinc-800/50">
        <button onClick={goBack} className="absolute left-4 p-2 text-zinc-400 hover:text-white">
          <DirectionalIcon icon={ArrowLeft} size={24} />
        </button>
        <h1 className="text-2xl font-bold">{t('seller.inventory.editProduct')}</h1>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute right-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg disabled:opacity-50"
        >
          {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="max-w-lg mx-auto p-6 pb-20">
        <div className="space-y-6 animate-fade-in">
          <div className="flex gap-4 items-start">
            <div className="w-20 h-28 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 shrink-0">
              {product.videoUrl ? (
                <ProductVideo productId={product.id} src={product.videoUrl} className="w-full h-full object-cover" muted />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">
                  {t('seller.inventory.noVideo')}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                  {t('product.title')}
                </label>
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
                  <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                    {t('product.price')}
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                    {t('product.stock')}
                  </label>
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

          <div className="pt-6">
            <button
              onClick={handleSave}
              disabled={!formData.title || !formData.price || isSaving}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {t('common.saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
