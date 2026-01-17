'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Store, AtSign, Phone, Loader2, Sparkles } from 'lucide-react';

interface OnboardingFormProps {
  locale: string;
}

/**
 * Seller Onboarding Form
 *
 * Collects shop information and creates a seller profile.
 */
export function OnboardingForm({ locale }: OnboardingFormProps) {
  const router = useRouter();
  const t = useTranslations();

  const [shopName, setShopName] = useState('');
  const [handle, setHandle] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate handle from shop name
  const generateHandle = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 30);
  };

  const handleShopNameChange = (value: string) => {
    setShopName(value);
    // Auto-generate handle if user hasn't manually edited it
    if (!handle || handle === generateHandle(shopName)) {
      setHandle(generateHandle(value));
    }
  };

  const handleHandleChange = (value: string) => {
    // Only allow valid handle characters
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setHandle(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate inputs
    if (shopName.length < 3) {
      setError(t('auth.onboarding.errors.shopNameTooShort'));
      setIsLoading(false);
      return;
    }

    if (handle.length < 3 || handle.length > 30) {
      setError(t('auth.onboarding.errors.handleInvalid'));
      setIsLoading(false);
      return;
    }

    // Format phone number for Morocco
    let formattedPhone = whatsappNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.slice(1);
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+212${formattedPhone}`;
    }

    try {
      const response = await fetch(`/api/sellers/me?locale=${locale}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          handle,
          whatsappNumber: formattedPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Handle already taken or seller exists
          if (data.error?.includes('handle')) {
            setError(t('auth.onboarding.errors.handleTaken'));
          } else {
            setError(t('auth.onboarding.errors.alreadySeller'));
          }
        } else {
          setError(data.error || t('auth.onboarding.errors.generic'));
        }
        setIsLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push(`/${locale}/seller/dashboard`);
    } catch {
      setError(t('auth.onboarding.errors.generic'));
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">{t('auth.onboarding.title')}</h1>
        <p className="mt-2 text-zinc-400">{t('auth.onboarding.subtitle')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shop Name */}
        <div>
          <label htmlFor="shopName" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Store className="h-4 w-4" />
            {t('auth.onboarding.shopName')}
          </label>
          <input
            type="text"
            id="shopName"
            value={shopName}
            onChange={(e) => handleShopNameChange(e.target.value)}
            placeholder={t('auth.onboarding.shopNamePlaceholder')}
            className="block w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
            minLength={3}
          />
        </div>

        {/* Handle */}
        <div>
          <label htmlFor="handle" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
            <AtSign className="h-4 w-4" />
            {t('auth.onboarding.handle')}
          </label>
          <div className="flex">
            <span className="inline-flex items-center rounded-s-xl border border-e-0 border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-400">
              vibecart.app/shop/
            </span>
            <input
              type="text"
              id="handle"
              value={handle}
              onChange={(e) => handleHandleChange(e.target.value)}
              placeholder={t('auth.onboarding.handlePlaceholder')}
              className="block w-full rounded-e-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_-]+"
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{t('auth.onboarding.handleHint')}</p>
        </div>

        {/* WhatsApp Number */}
        <div>
          <label htmlFor="whatsapp" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Phone className="h-4 w-4" />
            {t('auth.onboarding.whatsappNumber')}
          </label>
          <div className="flex">
            <span className="inline-flex items-center rounded-s-xl border border-e-0 border-zinc-700 bg-zinc-800 px-3 text-zinc-400">
              +212
            </span>
            <input
              type="tel"
              id="whatsapp"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="6XX XXX XXX"
              className="block w-full rounded-e-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            t('auth.onboarding.createShop')
          )}
        </button>
      </form>
    </div>
  );
}
