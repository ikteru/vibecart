'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
  Loader2,
  Truck,
  User,
  Phone,
  Plus,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import type { OrderResponseDTO } from '@/application/dtos/OrderDTO';
import type { DeliveryPersonDTO, CreateManualDispatchDTO } from '@/application/dtos/DeliveryDTO';

interface DispatchModalProps {
  order: OrderResponseDTO;
  isOpen: boolean;
  onClose: () => void;
  deliveryPersons: DeliveryPersonDTO[];
  onAddDeliveryPerson: () => void;
  onDispatch: (data: CreateManualDispatchDTO) => Promise<{
    success: boolean;
    error?: string;
    whatsappUrl?: string;
  }>;
}

/**
 * DispatchModal
 *
 * Modal for dispatching an order to a delivery person via WhatsApp.
 */
export function DispatchModal({
  order,
  isOpen,
  onClose,
  deliveryPersons,
  onAddDeliveryPerson,
  onDispatch,
}: DispatchModalProps) {
  const t = useTranslations('seller.delivery');
  const tCommon = useTranslations('common');

  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [codAmount, setCodAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedPersonId('');
      // Default COD to order total
      setCodAmount(order.total.amount.toString());
      setNotes('');
      setError(null);
    }
  }, [isOpen, order.total.amount]);

  const activePersons = deliveryPersons.filter((p) => p.isActive);
  const selectedPerson = activePersons.find((p) => p.id === selectedPersonId);

  const handleDispatch = async () => {
    setError(null);

    if (!selectedPersonId) {
      setError(t('dispatch.selectPerson'));
      return;
    }

    setIsDispatching(true);

    const data: CreateManualDispatchDTO = {
      orderId: order.id,
      sellerId: '', // Will be set by server
      deliveryPersonId: selectedPersonId,
      codAmount: codAmount ? parseInt(codAmount, 10) * 100 : undefined, // Convert to cents
      notes: notes.trim() || undefined,
    };

    const result = await onDispatch(data);
    setIsDispatching(false);

    if (result.success) {
      // Open WhatsApp
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank');
      }
      onClose();
    } else {
      setError(result.error || tCommon('error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t('dispatch.title')}</h2>
              <p className="text-xs text-zinc-500">{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* No delivery persons */}
          {activePersons.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <User size={24} className="text-zinc-500" />
              </div>
              <h3 className="text-white font-medium mb-1">{t('dispatch.noDeliveryPersons')}</h3>
              <p className="text-sm text-zinc-500 mb-4">{t('dispatch.addFirstPerson')}</p>
              <button
                onClick={() => {
                  onClose();
                  onAddDeliveryPerson();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Plus size={18} />
                {t('persons.add')}
              </button>
            </div>
          ) : (
            <>
              {/* Select Delivery Person */}
              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <User size={14} />
                  {t('dispatch.selectPerson')}
                </label>
                <div className="space-y-2">
                  {activePersons.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setSelectedPersonId(person.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-start ${
                        selectedPersonId === person.id
                          ? 'bg-emerald-500/10 border-emerald-500/50'
                          : 'bg-zinc-800/50 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedPersonId === person.id
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-zinc-600'
                        }`}
                      >
                        {selectedPersonId === person.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{person.name}</p>
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Phone size={10} />
                          <span dir="ltr">{person.phone}</span>
                          {person.dispatchCount > 0 && (
                            <span className="ms-2">
                              • {t('persons.dispatchCount', { count: person.dispatchCount })}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onAddDeliveryPerson();
                  }}
                  className="mt-2 w-full flex items-center justify-center gap-2 p-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <Plus size={16} />
                  {t('persons.add')}
                </button>
              </div>

              {/* COD Amount */}
              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  {t('dispatch.codAmount')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={codAmount}
                    onChange={(e) => setCodAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 pe-16 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                    MAD
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">{t('dispatch.codAmountHint')}</p>
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                  <MessageSquare size={14} />
                  {t('dispatch.notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('dispatch.notesPlaceholder')}
                  rows={2}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
                />
              </div>

              {/* Preview */}
              {selectedPerson && (
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3">
                  <p className="text-xs text-zinc-400 mb-2">
                    {t('dispatch.sendViaWhatsApp')} →
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <ExternalLink size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{selectedPerson.name}</p>
                      <p className="text-xs text-zinc-500" dir="ltr">
                        {selectedPerson.phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {activePersons.length > 0 && (
          <div className="p-4 border-t border-zinc-800 shrink-0">
            <button
              onClick={handleDispatch}
              disabled={isDispatching || !selectedPersonId}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
            >
              {isDispatching ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('dispatch.sending')}
                </>
              ) : (
                <>
                  <Truck size={18} />
                  {t('dispatch.sendViaWhatsApp')}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
