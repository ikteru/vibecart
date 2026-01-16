'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { X, Sparkles } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

/**
 * Coming Soon Modal
 *
 * Displays a modal indicating that a feature is coming soon.
 */
export function ComingSoonModal({ isOpen, onClose, featureName }: ComingSoonModalProps) {
  const t = useTranslations();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm mx-4 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="text-emerald-400" size={32} />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            {t('common.comingSoon')}
          </h2>

          {featureName && (
            <p className="text-zinc-400 text-sm mb-4">
              {t('common.featureComingSoon', { feature: featureName })}
            </p>
          )}

          {!featureName && (
            <p className="text-zinc-400 text-sm mb-4">
              {t('common.workingOnFeature')}
            </p>
          )}

          <button
            onClick={onClose}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
          >
            {t('common.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}
