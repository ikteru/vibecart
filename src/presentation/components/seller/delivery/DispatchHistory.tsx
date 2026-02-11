'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  RotateCcw,
  User,
  Phone,
  MessageSquare,
} from 'lucide-react';
import type { OrderDispatchDTO } from '@/application/dtos/DeliveryDTO';

interface DispatchHistoryProps {
  dispatches: OrderDispatchDTO[];
  locale: string;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  pending: {
    icon: <Clock size={14} />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20 border-yellow-500/30',
  },
  picked_up: {
    icon: <Package size={14} />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
  },
  in_transit: {
    icon: <Truck size={14} />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20 border-purple-500/30',
  },
  delivered: {
    icon: <CheckCircle size={14} />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20 border-emerald-500/30',
  },
  failed: {
    icon: <XCircle size={14} />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
  },
  returned: {
    icon: <RotateCcw size={14} />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 border-orange-500/30',
  },
};

/**
 * DispatchHistory
 *
 * Displays the dispatch history for an order.
 */
export function DispatchHistory({ dispatches, locale }: DispatchHistoryProps) {
  const t = useTranslations('seller.delivery');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return formatDate(dateString);
  };

  if (dispatches.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <Truck size={20} className="text-zinc-500" />
        </div>
        <p className="text-sm text-zinc-500">{t('history.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Truck size={16} />
        {t('history.title')}
      </h3>

      <div className="space-y-3">
        {dispatches.map((dispatch) => {
          const statusConfig = STATUS_CONFIG[dispatch.status] || STATUS_CONFIG.pending;

          return (
            <div
              key={dispatch.id}
              className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {/* Delivery Person */}
                  <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                    <User size={14} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">
                      {dispatch.deliveryPersonName || 'Unknown'}
                    </p>
                    {dispatch.deliveryPersonPhone && (
                      <p className="text-xs text-zinc-500" dir="ltr">
                        {dispatch.deliveryPersonPhone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${statusConfig.bgColor} ${statusConfig.color}`}
                >
                  {statusConfig.icon}
                  {t(`status.${dispatch.status}`)}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2">
                {/* COD Amount */}
                {dispatch.codAmount && dispatch.codAmount.amount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="text-emerald-400 font-medium">
                      {t('history.codAmount', {
                        amount: `${(dispatch.codAmount.amount / 100).toFixed(0)} ${dispatch.codAmount.currency}`,
                      })}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {dispatch.notes && (
                  <div className="flex items-start gap-2 text-sm text-zinc-400">
                    <MessageSquare size={14} className="mt-0.5 shrink-0" />
                    <p className="text-xs">{dispatch.notes}</p>
                  </div>
                )}

                {/* Dispatch Type */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
                  <p className="text-xs text-zinc-500">
                    {t('history.via', {
                      method: dispatch.dispatchType === 'manual' ? 'WhatsApp' : dispatch.dispatchType,
                    })}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatRelativeTime(dispatch.createdAt)}
                  </p>
                </div>

                {/* WhatsApp Sent */}
                {dispatch.whatsappSentAt && (
                  <p className="text-[10px] text-green-400">
                    ✓ WhatsApp sent {formatRelativeTime(dispatch.whatsappSentAt)}
                  </p>
                )}
              </div>

              {/* Status History */}
              {dispatch.statusHistory && dispatch.statusHistory.length > 1 && (
                <div className="mt-3 pt-3 border-t border-zinc-700">
                  <p className="text-xs text-zinc-500 mb-2">Status History</p>
                  <div className="space-y-1">
                    {dispatch.statusHistory.slice(-3).map((entry, index) => {
                      const entryConfig =
                        STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs text-zinc-400"
                        >
                          <span className={entryConfig.color}>{entryConfig.icon}</span>
                          <span>{t(`status.${entry.status}`)}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-500">
                            {formatRelativeTime(entry.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
