'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Store, ShoppingBag, Play, MessageCircle, Instagram } from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            {t('app.name')}
          </h1>
          <p className="text-lg text-zinc-400">{t('app.tagline')}</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 py-8">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/20">
              <Play className="h-6 w-6 text-primary-500" />
            </div>
            <span className="text-xs text-zinc-400">
              {t('landing.features.video')}
            </span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <MessageCircle className="h-6 w-6 text-green-500" />
            </div>
            <span className="text-xs text-zinc-400">
              {t('landing.features.whatsapp')}
            </span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/20">
              <Instagram className="h-6 w-6 text-pink-500" />
            </div>
            <span className="text-xs text-zinc-400">
              {t('landing.features.instagram')}
            </span>
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-4">
          <a
            href="/ar-MA/seller/dashboard"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary-500 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-600 active:scale-[0.98]"
          >
            <Store className="h-6 w-6" />
            {t('landing.roles.seller')}
          </a>

          <a
            href="/ar-MA/shop/ayyuur-home"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-800 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-zinc-700 active:scale-[0.98]"
          >
            <ShoppingBag className="h-6 w-6" />
            {t('landing.roles.buyer')}
          </a>
        </div>

        {/* Language Selector */}
        <div className="pt-8">
          <LanguageSelector />
        </div>
      </div>
    </div>
  );
}

function LanguageSelector() {
  const languages = [
    { code: 'ar-MA', name: 'الدارجة', flag: '🇲🇦' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {languages.map((lang) => (
        <a
          key={lang.code}
          href={`/${lang.code}`}
          className="flex items-center gap-1 rounded-full bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          <span>{lang.flag}</span>
          <span>{lang.name}</span>
        </a>
      ))}
    </div>
  );
}
