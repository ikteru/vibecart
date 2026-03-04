'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link2, Check, Share2 } from 'lucide-react';

interface ShareLinkCardProps {
  handle: string;
}

/**
 * ShareLinkCard
 *
 * Prominent card showing the seller's shop URL with copy and share buttons.
 */
export function ShareLinkCard({ handle }: ShareLinkCardProps) {
  const t = useTranslations('seller.dashboard.shareLink');
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shopUrl = `${appUrl}/shop/${handle}`;
  const displayUrl = `vibecart.app/shop/${handle}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shopUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(shopUrl);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareInstagram = async () => {
    // Use Web Share API if available (works well on mobile)
    if (navigator.share) {
      try {
        await navigator.share({ url: shopUrl });
      } catch {
        // User cancelled or not supported
      }
    } else {
      // Fallback: copy and prompt to paste on Instagram
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Link2 size={16} className="text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">{t('title')}</h3>
      </div>

      {/* URL Display + Copy */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-between gap-2 bg-black border border-zinc-700 rounded-xl px-4 py-3 mb-3 hover:border-emerald-500/50 transition-colors group"
      >
        <span className="text-sm text-zinc-300 truncate">{displayUrl}</span>
        {copied ? (
          <span className="flex items-center gap-1 text-emerald-400 text-xs shrink-0">
            <Check size={14} />
            {t('copied')}
          </span>
        ) : (
          <Share2 size={14} className="text-zinc-500 group-hover:text-emerald-400 shrink-0" />
        )}
      </button>

      {/* Share Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleShareWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#25D366]/10 text-[#25D366] text-xs font-medium hover:bg-[#25D366]/20 transition-colors"
        >
          {t('shareWhatsApp')}
        </button>
        <button
          onClick={handleShareInstagram}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-pink-500/10 text-pink-400 text-xs font-medium hover:bg-pink-500/20 transition-colors"
        >
          {t('shareInstagram')}
        </button>
      </div>
    </div>
  );
}
