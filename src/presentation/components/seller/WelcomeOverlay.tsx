'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Share2, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface WelcomeOverlayProps {
  handle: string;
}

/**
 * WelcomeOverlay
 *
 * Celebration overlay shown when a new seller arrives from Instagram login.
 * Triggered by ?welcome=true query param. Auto-dismisses after 8s or on click.
 */
export function WelcomeOverlay({ handle }: WelcomeOverlayProps) {
  const t = useTranslations('seller.dashboard.welcome');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  const isWelcome = searchParams.get('welcome') === 'true';
  const [visible, setVisible] = useState(isWelcome);

  useEffect(() => {
    if (!isWelcome) return;

    const timer = setTimeout(() => {
      setVisible(false);
      // Clean up the URL
      router.replace(pathname, { scroll: false });
    }, 8000);

    return () => clearTimeout(timer);
  }, [isWelcome, router, pathname]);

  const handleDismiss = () => {
    setVisible(false);
    router.replace(pathname, { scroll: false });
  };

  if (!visible) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shopUrl = `${appUrl}/shop/${handle}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: shopUrl });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shopUrl);
    }
    handleDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleDismiss}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-sm mx-4 text-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{t('title')}</h2>
        <p className="text-sm text-zinc-400 mb-6">{t('subtitle')}</p>

        {/* Shop URL */}
        <div className="bg-black border border-zinc-700 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-emerald-400 font-mono truncate">
            vibecart.app/shop/{handle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
          >
            <Share2 size={16} />
            {t('shareNow')}
          </button>
          <Link
            href={`/${locale}/seller/dashboard`}
            onClick={handleDismiss}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-colors"
          >
            <Package size={16} />
            {t('addProducts')}
          </Link>
        </div>
      </div>
    </div>
  );
}
