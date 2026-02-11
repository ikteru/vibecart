'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Loader2, User, Phone, FileText } from 'lucide-react';
import type {
  DeliveryPersonDTO,
  CreateDeliveryPersonDTO,
  UpdateDeliveryPersonDTO,
} from '@/application/dtos/DeliveryDTO';

interface DeliveryPersonFormProps {
  person?: DeliveryPersonDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: CreateDeliveryPersonDTO | UpdateDeliveryPersonDTO
  ) => Promise<{ success: boolean; error?: string }>;
}

/**
 * DeliveryPersonForm
 *
 * Modal form for creating or editing a delivery person.
 */
export function DeliveryPersonForm({
  person,
  isOpen,
  onClose,
  onSave,
}: DeliveryPersonFormProps) {
  const t = useTranslations('seller.delivery');
  const tCommon = useTranslations('common');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!person;

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      if (person) {
        setName(person.name);
        setPhone(person.phone);
        setNotes(person.notes || '');
      } else {
        setName('');
        setPhone('');
        setNotes('');
      }
      setError(null);
    }
  }, [isOpen, person]);

  const validatePhone = (value: string): boolean => {
    // Moroccan phone number format
    const phoneRegex = /^(0|\+212|212)[567]\d{8}$/;
    return phoneRegex.test(value.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError(t('persons.name') + ' is required');
      return;
    }

    const cleanPhone = phone.replace(/\s/g, '');
    if (!validatePhone(cleanPhone)) {
      setError('Invalid Moroccan phone number');
      return;
    }

    setIsSaving(true);

    const data = isEditing
      ? {
          id: person!.id,
          sellerId: person!.sellerId,
          name: name.trim(),
          phone: cleanPhone,
          notes: notes.trim() || undefined,
        }
      : {
          sellerId: '', // Will be set by server
          name: name.trim(),
          phone: cleanPhone,
          notes: notes.trim() || undefined,
        };

    const result = await onSave(data);
    setIsSaving(false);

    if (result.success) {
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
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? t('persons.edit') : t('persons.add')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
              <User size={14} />
              {t('persons.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ahmed"
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              autoFocus
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
              <Phone size={14} />
              {t('persons.phone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212 6XX XXX XXX"
              dir="ltr"
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Format: +212 6XX XXX XXX
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
              <FileText size={14} />
              {t('persons.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('persons.notesPlaceholder')}
              rows={3}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                tCommon('save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
