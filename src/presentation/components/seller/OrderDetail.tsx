'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Loader2,
  Check,
  Truck,
  Package,
  XCircle,
  MessageCircle,
  Phone,
  MapPin,
  Send,
  Clock,
} from 'lucide-react';
import { DirectionalIcon } from '@/presentation/components/ui/DirectionalIcon';
import { DispatchModal, DispatchHistory } from './delivery';
import type { OrderResponseDTO, UpdateOrderStatusDTO } from '@/application/dtos/OrderDTO';
import type {
  DeliveryPersonDTO,
  CreateManualDispatchDTO,
  OrderDispatchDTO,
} from '@/application/dtos/DeliveryDTO';

interface OrderDetailProps {
  order: OrderResponseDTO;
  locale: string;
  sellerId: string;
  updateStatusAction: (
    action: UpdateOrderStatusDTO['action']
  ) => Promise<{ success: boolean; error?: string; order?: OrderResponseDTO }>;
  sendMessageAction: (content: string) => Promise<{ success: boolean; error?: string }>;
  // Delivery dispatch props
  deliveryPersons?: DeliveryPersonDTO[];
  dispatches?: OrderDispatchDTO[];
  onAddDeliveryPerson?: () => void;
  onDispatch?: (data: CreateManualDispatchDTO) => Promise<{
    success: boolean;
    error?: string;
    whatsappUrl?: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={14} />,
  confirmed: <Check size={14} />,
  shipped: <Truck size={14} />,
  delivered: <Package size={14} />,
  cancelled: <XCircle size={14} />,
};

/**
 * Order Detail Client Component
 *
 * Displays full order details with status management and messaging.
 */
export function OrderDetail({
  order: initialOrder,
  locale,
  updateStatusAction,
  sendMessageAction,
  deliveryPersons = [],
  dispatches = [],
  onAddDeliveryPerson,
  onDispatch,
}: OrderDetailProps) {
  const router = useRouter();
  const t = useTranslations();

  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  const handleStatusUpdate = async (action: UpdateOrderStatusDTO['action']) => {
    setError(null);
    setIsUpdating(true);

    const result = await updateStatusAction(action);
    setIsUpdating(false);

    if (result.success && result.order) {
      setOrder(result.order);
    } else {
      setError(result.error || t('errors.serverError'));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    setError(null);
    setIsSending(true);

    const result = await sendMessageAction(messageInput.trim());
    setIsSending(false);

    if (result.success) {
      // Add message locally for immediate feedback
      setOrder((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: crypto.randomUUID(),
            sender: 'seller' as const,
            content: messageInput.trim(),
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setMessageInput('');
    } else {
      setError(result.error || t('errors.serverError'));
    }
  };

  const openWhatsApp = () => {
    const phone = order.customerPhone.replace(/^\+/, '');
    const message = encodeURIComponent(
      `${t('seller.orders.whatsappGreeting', { name: order.customerName, orderNumber: order.orderNumber })}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const goBack = () => {
    router.push(`/${locale}/seller/orders`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // Determine available actions based on status
  const canConfirm = order.isPending;
  const canShip = order.isConfirmed;
  const canDeliver = order.isShipped;
  const canCancel = order.isPending || order.isConfirmed;

  // Dispatch availability
  const canDispatch = (order.isConfirmed || order.isShipped) && !order.isCancelled;
  const hasActiveDispatch = dispatches.some(
    (d) => d.status !== 'delivered' && d.status !== 'failed' && d.status !== 'returned'
  );

  const handleDispatch = async (data: CreateManualDispatchDTO) => {
    if (!onDispatch) return { success: false, error: 'Dispatch not available' };
    return onDispatch(data);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 px-4 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 text-zinc-400 hover:text-white">
            <DirectionalIcon icon={ArrowLeft} size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{order.orderNumber}</h1>
            <p className="text-xs text-zinc-500">{formatDate(order.createdAt)}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              STATUS_COLORS[order.status]
            }`}
          >
            {STATUS_ICONS[order.status]}
            {t(`order.status.${order.status}`)}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Customer Info */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-white mb-3">
            {t('seller.orders.customerInfo')}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{order.customerName}</p>
                <p className="text-xs text-zinc-500">{order.customerPhone}</p>
              </div>
              <button
                onClick={openWhatsApp}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Phone size={16} />
                WhatsApp
              </button>
            </div>

            <div className="border-t border-zinc-800 pt-3">
              <div className="flex items-start gap-2 text-sm text-zinc-400">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p>{order.shippingAddress.street}</p>
                  {order.shippingAddress.buildingName && (
                    <p>{order.shippingAddress.buildingName}</p>
                  )}
                  {order.shippingAddress.floor && (
                    <p>
                      {t('seller.orders.floor')} {order.shippingAddress.floor}
                      {order.shippingAddress.apartmentNumber &&
                        `, ${t('seller.orders.apt')} ${order.shippingAddress.apartmentNumber}`}
                    </p>
                  )}
                  <p>
                    {order.shippingAddress.neighborhood &&
                      `${order.shippingAddress.neighborhood}, `}
                    {order.shippingAddress.city}
                  </p>
                  {order.shippingAddress.deliveryInstructions && (
                    <p className="text-xs text-zinc-500 mt-1 italic">
                      {order.shippingAddress.deliveryInstructions}
                    </p>
                  )}
                </div>
              </div>
              {order.shippingAddress.locationUrl && (
                <a
                  href={order.shippingAddress.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  <MapPin size={12} />
                  {t('seller.orders.viewOnMap')}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Order Items */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-white mb-3">
            {t('seller.orders.items')} ({order.items.length})
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm text-white">{item.title}</p>
                  {item.selectedVariant && (
                    <p className="text-xs text-zinc-500">{item.selectedVariant}</p>
                  )}
                  <p className="text-xs text-zinc-500">
                    {item.price.amount} {t('currency.MAD_symbol')} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium text-white">
                  {item.subtotal.amount} {t('currency.MAD_symbol')}
                </p>
              </div>
            ))}

            <div className="pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>{t('seller.orders.subtotal')}</span>
                <span>
                  {order.subtotal.amount} {t('currency.MAD_symbol')}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>{t('seller.orders.shipping')}</span>
                <span>
                  {order.shippingCost.amount} {t('currency.MAD_symbol')}
                </span>
              </div>
              <div className="flex justify-between font-bold text-white pt-2 border-t border-zinc-800">
                <span>{t('seller.orders.total')}</span>
                <span>
                  {order.total.amount} {t('currency.MAD_symbol')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Status Timeline */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-white mb-3">
            {t('seller.orders.timeline')}
          </h2>
          <div className="space-y-4">
            <TimelineItem
              icon={<Clock size={14} />}
              label={t('order.status.pending')}
              time={formatDate(order.createdAt)}
              isActive={order.isPending}
              isCompleted={!order.isPending && !order.isCancelled}
            />
            <TimelineItem
              icon={<Check size={14} />}
              label={t('order.status.confirmed')}
              time={formatDate(order.confirmedAt)}
              isActive={order.isConfirmed}
              isCompleted={order.isShipped || order.isDelivered}
            />
            <TimelineItem
              icon={<Truck size={14} />}
              label={t('order.status.shipped')}
              time={formatDate(order.shippedAt)}
              isActive={order.isShipped}
              isCompleted={order.isDelivered}
            />
            <TimelineItem
              icon={<Package size={14} />}
              label={t('order.status.delivered')}
              time={formatDate(order.deliveredAt)}
              isActive={order.isDelivered}
              isCompleted={false}
            />
            {order.isCancelled && (
              <TimelineItem
                icon={<XCircle size={14} />}
                label={t('order.status.cancelled')}
                time={formatDate(order.updatedAt)}
                isActive={true}
                isCompleted={false}
                variant="error"
              />
            )}
          </div>
        </section>

        {/* Dispatch Button */}
        {canDispatch && onDispatch && (
          <section>
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              disabled={hasActiveDispatch}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                hasActiveDispatch
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Truck size={18} />
              {hasActiveDispatch
                ? t('seller.delivery.dispatch.alreadyDispatched')
                : t('seller.delivery.dispatch.title')}
            </button>
          </section>
        )}

        {/* Dispatch History */}
        {dispatches.length > 0 && (
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <DispatchHistory dispatches={dispatches} locale={locale} />
          </section>
        )}

        {/* Action Buttons */}
        {!order.isDelivered && !order.isCancelled && (
          <section className="space-y-3">
            {canConfirm && (
              <button
                onClick={() => handleStatusUpdate('confirm')}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-medium transition-colors"
              >
                {isUpdating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                {t('seller.orders.confirmOrder')}
              </button>
            )}
            {canShip && (
              <button
                onClick={() => handleStatusUpdate('ship')}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl font-medium transition-colors"
              >
                {isUpdating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Truck size={18} />
                )}
                {t('seller.orders.markShipped')}
              </button>
            )}
            {canDeliver && (
              <button
                onClick={() => handleStatusUpdate('deliver')}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl font-medium transition-colors"
              >
                {isUpdating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Package size={18} />
                )}
                {t('seller.orders.markDelivered')}
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => {
                  if (confirm(t('seller.orders.confirmCancel'))) {
                    handleStatusUpdate('cancel');
                  }
                }}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-red-600/20 hover:text-red-400 border border-zinc-700 hover:border-red-500/50 disabled:opacity-50 rounded-xl font-medium transition-colors"
              >
                {isUpdating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <XCircle size={18} />
                )}
                {t('seller.orders.cancelOrder')}
              </button>
            )}
          </section>
        )}

        {/* Messages */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <MessageCircle size={16} />
            {t('seller.orders.messages')}
          </h2>

          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {order.messages.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">
                {t('seller.orders.noMessages')}
              </p>
            ) : (
              order.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg text-sm ${
                    msg.sender === 'seller'
                      ? 'bg-blue-500/20 text-blue-100 ms-8'
                      : msg.sender === 'buyer'
                      ? 'bg-zinc-800 text-white me-8'
                      : 'bg-zinc-800/50 text-zinc-400 text-xs italic text-center'
                  }`}
                >
                  {msg.sender !== 'system' && (
                    <p className="text-[10px] text-zinc-500 mb-1">
                      {msg.sender === 'seller'
                        ? t('seller.orders.you')
                        : order.customerName}
                    </p>
                  )}
                  <p>{msg.content}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {formatDate(msg.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={t('seller.orders.typeMessage')}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isSending || !messageInput.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {isSending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </section>
      </div>

      {/* Dispatch Modal */}
      {onDispatch && onAddDeliveryPerson && (
        <DispatchModal
          order={order}
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          deliveryPersons={deliveryPersons}
          onAddDeliveryPerson={onAddDeliveryPerson}
          onDispatch={handleDispatch}
        />
      )}
    </div>
  );
}

interface TimelineItemProps {
  icon: React.ReactNode;
  label: string;
  time: string;
  isActive: boolean;
  isCompleted: boolean;
  variant?: 'default' | 'error';
}

function TimelineItem({
  icon,
  label,
  time,
  isActive,
  isCompleted,
  variant = 'default',
}: TimelineItemProps) {
  const getStyles = () => {
    if (variant === 'error') {
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
    if (isActive) {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
    if (isCompleted) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
    return 'bg-zinc-800 text-zinc-500 border-zinc-700';
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-full border flex items-center justify-center ${getStyles()}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm ${isActive || isCompleted ? 'text-white' : 'text-zinc-500'}`}>
          {label}
        </p>
        {(isActive || isCompleted || variant === 'error') && (
          <p className="text-xs text-zinc-500">{time}</p>
        )}
      </div>
    </div>
  );
}
