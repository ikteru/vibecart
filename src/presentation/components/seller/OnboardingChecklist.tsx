'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, Circle, Instagram, MessageCircle, Package, Share2 } from 'lucide-react';
import type { SellerResponseDTO } from '@/application/dtos/SellerDTO';

interface OnboardingChecklistProps {
  seller: SellerResponseDTO;
  productCount: number;
}

/**
 * OnboardingChecklist
 *
 * Progressive checklist showing setup completion steps.
 * Hidden when all items are complete.
 */
export function OnboardingChecklist({ seller, productCount }: OnboardingChecklistProps) {
  const t = useTranslations('seller.dashboard.checklist');

  const steps = [
    {
      key: 'connectInstagram',
      label: t('connectInstagram'),
      done: seller.shopConfig.instagram?.isConnected || false,
      icon: Instagram,
    },
    {
      key: 'addWhatsApp',
      label: t('addWhatsApp'),
      done: !!seller.whatsappNumber,
      icon: MessageCircle,
    },
    {
      key: 'publishProduct',
      label: t('publishProduct'),
      done: productCount > 0,
      icon: Package,
    },
    {
      key: 'shareLink',
      label: t('shareLink'),
      done: false, // We can't track this easily; keep it as manual
      icon: Share2,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  if (allDone) return null;

  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{t('title')}</h3>
        <span className="text-xs text-zinc-500">{completedCount}/{steps.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-4">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.key}
            className={`flex items-center gap-3 p-2 rounded-lg ${
              step.done ? 'opacity-60' : ''
            }`}
          >
            {step.done ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <Circle size={16} className="text-zinc-600 shrink-0" />
            )}
            <step.icon size={14} className={step.done ? 'text-zinc-500' : 'text-zinc-400'} />
            <span className={`text-sm ${step.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
