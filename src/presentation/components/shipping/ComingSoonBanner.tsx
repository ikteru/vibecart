'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Truck, Package, Printer, Clock } from 'lucide-react';
import { ComingSoonModal } from '@/presentation/components/ui/ComingSoonModal';

interface ComingSoonBannerProps {
  className?: string;
}

/**
 * Coming Soon Banner for Shipping Aggregator
 *
 * Displays a preview of the upcoming shipping features
 * with a "Coming Soon" indicator.
 */
export function ComingSoonBanner({ className = '' }: ComingSoonBannerProps) {
  const t = useTranslations('shipping');
  const tCommon = useTranslations('common');
  const [showComingSoon, setShowComingSoon] = useState(false);

  const features = [
    {
      icon: Truck,
      titleKey: 'features.multiProvider',
      descKey: 'features.multiProviderDesc',
    },
    {
      icon: Printer,
      titleKey: 'features.labels',
      descKey: 'features.labelsDesc',
    },
    {
      icon: Package,
      titleKey: 'features.tracking',
      descKey: 'features.trackingDesc',
    },
  ];

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 ${className}`}>
      {/* Coming Soon Badge */}
      <div className="absolute top-4 end-4 z-10">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/90 rounded-full text-white text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>{t('comingSoon')}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-violet-500/20">
              <Truck className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {t('title')}
            </h2>
          </div>
          <p className="text-zinc-400 text-sm md:text-base">
            {t('description')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <feature.icon className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white text-sm mb-1">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-zinc-500 text-xs">
                    {t(feature.descKey)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Provider Logos Preview */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-zinc-500 text-xs mb-3">{t('supportedProviders')}</p>
          <div className="flex flex-wrap gap-3">
            {['Amana Express', 'Glovo', 'CTM', 'Poste Maroc'].map((provider) => (
              <div
                key={provider}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-xs"
              >
                {provider}
              </div>
            ))}
          </div>
        </div>

        {/* Notify Me */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input
            type="email"
            placeholder={t('notifyPlaceholder')}
            className="flex-1 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <button
            onClick={() => setShowComingSoon(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors"
          >
            {t('notifyButton')}
          </button>
        </div>
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        featureName={t('title')}
      />

      {/* Background Decoration */}
      <div className="absolute -bottom-20 -end-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 -start-10 w-40 h-40 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
