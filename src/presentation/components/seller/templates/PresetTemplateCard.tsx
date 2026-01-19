'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, Sparkles, Check } from 'lucide-react';
import type { PresetTemplate, PresetButton, EVENT_DISPLAY_INFO } from '@/application/data/presetTemplates';
import type { TemplateLanguage } from '@/domain/entities/WhatsAppMessageTemplate';

interface PresetTemplateCardProps {
  preset: PresetTemplate;
  language: TemplateLanguage;
  locale: string;
  eventInfo: (typeof EVENT_DISPLAY_INFO)[keyof typeof EVENT_DISPLAY_INFO];
}

/**
 * Preset Template Card Component
 *
 * Displays a preset template with preview, button preview, and one-tap activation.
 */
export function PresetTemplateCard({
  preset,
  language,
  locale,
  eventInfo,
}: PresetTemplateCardProps) {
  const router = useRouter();
  const t = useTranslations('templates');
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  const bodyText = preset.body[language] || preset.body.en;
  const description = preset.description[language] || preset.description.en;

  // Replace placeholders with example values for preview
  const previewText = bodyText
    .replace('{{1}}', t('preview.exampleCustomerName'))
    .replace('{{2}}', t('preview.exampleOrderNumber'))
    .replace('{{3}}', t('preview.exampleAmount'))
    .replace('{{4}}', t('preview.exampleTracking'))
    .replace('{{5}}', t('preview.exampleShopName'))
    .replace('{{6}}', t('preview.exampleItemsCount'));

  // Get localized button text
  const getButtonText = (button: PresetButton): string => {
    return button.text[language] || button.text.en;
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      const response = await fetch('/api/whatsapp/templates/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetId: preset.id,
          language,
        }),
      });

      if (response.ok) {
        setActivated(true);
        setTimeout(() => {
          router.push(`/${locale}/seller/templates`);
          router.refresh();
        }, 500);
      }
    } finally {
      setActivating(false);
    }
  };

  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
    emerald: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
    blue: 'bg-blue-900/30 text-blue-400 border-blue-800',
    green: 'bg-green-900/30 text-green-400 border-green-800',
    red: 'bg-red-900/30 text-red-400 border-red-800',
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-[10px] uppercase px-2 py-0.5 rounded border ${colorClasses[eventInfo.color]}`}
          >
            {eventInfo.label}
          </span>
          <Sparkles size={14} className="text-zinc-600" />
        </div>
        <h3 className="font-medium text-white text-sm">{description}</h3>
      </div>

      {/* Preview */}
      <div className="p-4 bg-zinc-950">
        <div className="text-[10px] text-zinc-500 uppercase mb-2">{t('preview.label')}</div>
        <div className="bg-[#005C4B] text-white text-xs p-3 rounded-lg rounded-tl-none max-w-[85%]">
          {previewText}
        </div>

        {/* Button Preview */}
        {preset.buttons && preset.buttons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {preset.buttons.map((button, index) => (
              <div
                key={index}
                className="bg-zinc-800 text-zinc-300 text-[10px] px-3 py-1.5 rounded-full border border-zinc-700 flex items-center gap-1"
              >
                <span className="text-[#25D366]">↩</span>
                {getButtonText(button)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variables Used */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <div className="flex flex-wrap gap-1">
          {preset.variablesUsed.map((v) => (
            <span
              key={v}
              className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded"
            >
              {v.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleActivate}
          disabled={activating || activated}
          className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activated
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          } disabled:opacity-70`}
        >
          {activating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : activated ? (
            <Check size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          {activated ? t('button.created') : activating ? t('button.creating') : t('button.useThis')}
        </button>
      </div>
    </div>
  );
}
