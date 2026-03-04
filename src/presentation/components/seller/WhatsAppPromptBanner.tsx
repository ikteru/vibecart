'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, X, Loader2 } from 'lucide-react';

interface WhatsAppPromptBannerProps {
  onSave: (whatsappNumber: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * WhatsAppPromptBanner
 *
 * Non-blocking amber banner prompting Instagram-login sellers to add WhatsApp.
 * Dismissible via sessionStorage, reappears next session.
 */
export function WhatsAppPromptBanner({ onSave }: WhatsAppPromptBannerProps) {
  const t = useTranslations('seller.dashboard.whatsappPrompt');
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('whatsapp-prompt-dismissed') === 'true';
  });
  const [phone, setPhone] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('whatsapp-prompt-dismissed', 'true');
    setDismissed(true);
  };

  const handleSave = () => {
    if (!phone.trim()) return;

    setError(null);
    startTransition(async () => {
      // Format: if starts with 0, convert to 212 prefix
      let formatted = phone.trim();
      if (formatted.startsWith('0')) {
        formatted = `212${formatted.slice(1)}`;
      } else if (formatted.startsWith('+212')) {
        formatted = formatted.slice(1);
      } else if (!formatted.startsWith('212')) {
        formatted = `212${formatted}`;
      }

      const result = await onSave(formatted);
      if (result.success) {
        setDismissed(true);
      } else {
        setError(result.error || 'Failed to save');
      }
    });
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">{t('title')}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{t('description')}</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-zinc-500 hover:text-zinc-300 shrink-0"
          aria-label={t('dismiss')}
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1">
          <span className="inline-flex items-center rounded-s-lg border border-e-0 border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-400">
            +212
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="6XX XXX XXX"
            className="flex-1 min-w-0 bg-black border border-zinc-700 rounded-e-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isPending || !phone.trim()}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : t('save')}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}
