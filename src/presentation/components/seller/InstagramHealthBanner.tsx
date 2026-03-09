'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle, Instagram, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

type HealthStatus = 'healthy' | 'expiring' | 'expired' | 'revoked' | 'refresh_failed' | 'disconnected';

interface HealthData {
  status: HealthStatus;
  daysRemaining?: number;
  needsReconnect: boolean;
  username?: string;
}

/**
 * InstagramHealthBanner
 *
 * Shown on the seller dashboard:
 * - Green compact indicator when healthy
 * - Red for expired/revoked, amber for expiring soon
 * Dismissible via sessionStorage.
 */
export function InstagramHealthBanner() {
  const t = useTranslations('seller.dashboard.instagramHealth');
  const locale = useLocale();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem('ig-health-dismissed') === 'true') {
      setDismissed(true);
    }

    fetch('/api/instagram/health')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data) setHealth(data);
      })
      .catch(() => {});
  }, []);

  if (!health) return null;
  if (health.status === 'disconnected') return null;

  // Healthy state — compact green indicator
  if (health.status === 'healthy') {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-xl mb-4 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
        <Instagram size={14} className="shrink-0" />
        <span className="flex-1">
          {health.username && t('connectedAs', { username: health.username })}
          {health.daysRemaining != null && (
            <span className="ms-1 text-emerald-500/60">
              · {t('daysLeft', { days: health.daysRemaining })}
            </span>
          )}
        </span>
        <CheckCircle size={14} className="shrink-0 text-emerald-500" />
      </div>
    );
  }

  // Problem states — only show if not dismissed
  if (dismissed) return null;

  const isUrgent = health.status === 'expired' || health.status === 'revoked';
  const isWarning = health.status === 'expiring' || health.status === 'refresh_failed';

  if (!isUrgent && !isWarning) return null;

  const getMessage = () => {
    switch (health.status) {
      case 'expired':
        return t('expired');
      case 'revoked':
        return t('revoked');
      case 'expiring':
        return t('expiringSoon', { days: health.daysRemaining ?? 0 });
      case 'refresh_failed':
        return t('refreshFailed');
      default:
        return '';
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('ig-health-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl mb-4 text-sm ${
        isUrgent
          ? 'bg-red-500/10 border border-red-500/30 text-red-400'
          : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
      }`}
    >
      <AlertCircle size={18} className="shrink-0" />
      <span className="flex-1">{getMessage()}</span>

      {health.needsReconnect && (
        <Link
          href={`/${locale}/seller/settings`}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
            isUrgent
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-black'
          }`}
        >
          <RefreshCw size={12} />
          {t('reconnect')}
        </Link>
      )}

      <button
        onClick={handleDismiss}
        className="opacity-60 hover:opacity-100 shrink-0"
        aria-label={t('dismiss')}
      >
        <X size={14} />
      </button>
    </div>
  );
}
