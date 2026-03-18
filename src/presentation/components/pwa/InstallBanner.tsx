'use client';

import { useTranslations } from 'next-intl';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '@/presentation/hooks/useInstallPrompt';

export function InstallBanner() {
  const t = useTranslations('app');
  const { isInstallable, install, dismiss } = useInstallPrompt();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-20 inset-x-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Download size={20} className="text-emerald-400" />
        </div>
        <p className="text-zinc-300 text-sm flex-1 leading-snug">
          {t('installPrompt')}
        </p>
        <button
          onClick={install}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium shrink-0 transition-colors"
        >
          {t('installButton')}
        </button>
        <button
          onClick={dismiss}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
