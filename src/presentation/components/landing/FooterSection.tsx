'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Instagram, MessageCircle } from 'lucide-react';

export function FooterSection() {
  const t = useTranslations('landing.footer');

  const languages = [
    { code: 'ar-MA', name: 'الدارجة', flag: '🇲🇦' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-950 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="VibeCart" className="h-8 w-8" />
            <span className="text-lg font-bold text-white" dir="ltr">VibeCart</span>
          </div>
          <p className="text-sm text-zinc-500">{t('tagline')}</p>
        </div>

        {/* Language selector */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {languages.map((lang) => (
            <a
              key={lang.code}
              href={`/${lang.code}`}
              className="flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </a>
          ))}
        </div>

        {/* Links + Social */}
        <div className="flex flex-col items-center gap-4 border-t border-zinc-800/50 pt-8">
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link href="/ar-MA/legal/privacy" className="hover:text-primary-500 transition-colors">
              {t('privacy')}
            </Link>
            <Link href="/ar-MA/legal/terms" className="hover:text-primary-500 transition-colors">
              {t('terms')}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="text-zinc-500 transition-colors hover:text-pink-400">
              <Instagram size={18} />
            </a>
            <a href="#" className="text-zinc-500 transition-colors hover:text-green-400">
              <MessageCircle size={18} />
            </a>
          </div>

          <p className="text-xs text-zinc-600">
            {t('madeIn')}
          </p>

          <p className="text-[10px] text-zinc-700">
            © {new Date().getFullYear()} <span dir="ltr">VibeCart</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
