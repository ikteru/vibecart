'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Store } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('customer.shopNotFound');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      {/* Ghost shop icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Store size={40} className="text-zinc-600" />
        </div>
        <div className="absolute -top-1 -end-1 w-8 h-8 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center">
          <span className="text-zinc-500 text-sm font-bold">?</span>
        </div>
      </div>

      <h1 className="text-white text-xl font-bold mb-2">{t('title')}</h1>
      <p className="text-zinc-500 text-sm max-w-xs leading-relaxed mb-8">
        {t('description')}
      </p>

      <button
        onClick={() => router.push('/')}
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-colors"
      >
        {t('backHome')}
      </button>
    </div>
  );
}
