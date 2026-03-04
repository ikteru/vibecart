'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

/**
 * InstagramReconnectGuide
 *
 * Collapsible card with numbered reconnection steps.
 * Shown in settings when the Instagram connection is broken.
 */
export function InstagramReconnectGuide() {
  const t = useTranslations('seller.settings.instagram.reconnectGuide');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-start"
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={14} className="text-amber-400" />
          <span className="text-xs font-medium text-amber-400">{t('whyNeeded')}</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={14} className="text-amber-400" />
        ) : (
          <ChevronDown size={14} className="text-amber-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          <p className="text-[11px] text-zinc-400">{t('explanation')}</p>
          <div className="space-y-2">
            {[t('step1'), t('step2'), t('step3')].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-zinc-300">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
