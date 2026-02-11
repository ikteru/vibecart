'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  User,
  Phone,
  Truck,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { DeliveryPersonDTO } from '@/application/dtos/DeliveryDTO';

interface DeliveryPersonListProps {
  persons: DeliveryPersonDTO[];
  onAdd: () => void;
  onEdit: (person: DeliveryPersonDTO) => void;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onToggleActive: (id: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
}

/**
 * DeliveryPersonList
 *
 * Displays a list of delivery persons with actions.
 */
export function DeliveryPersonList({
  persons,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
}: DeliveryPersonListProps) {
  const t = useTranslations('seller.delivery');
  const tCommon = useTranslations('common');

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm(t('persons.deleteConfirm'))) return;

    setError(null);
    setDeletingId(id);
    setMenuOpenId(null);

    const result = await onDelete(id);
    setDeletingId(null);

    if (!result.success) {
      setError(result.error || tCommon('error'));
    }
  };

  const handleToggleActive = async (person: DeliveryPersonDTO) => {
    setError(null);
    setTogglingId(person.id);
    setMenuOpenId(null);

    const result = await onToggleActive(person.id, !person.isActive);
    setTogglingId(null);

    if (!result.success) {
      setError(result.error || tCommon('error'));
    }
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{t('persons.title')}</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          {t('persons.add')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Empty State */}
      {persons.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck size={28} className="text-zinc-500" />
          </div>
          <h3 className="text-white font-medium mb-1">{t('persons.empty')}</h3>
          <p className="text-sm text-zinc-500 mb-4">{t('persons.emptyDescription')}</p>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            {t('persons.add')}
          </button>
        </div>
      ) : (
        /* Person List */
        <div className="space-y-3">
          {persons.map((person) => (
            <div
              key={person.id}
              className={`bg-zinc-900 border rounded-xl p-4 transition-opacity ${
                person.isActive ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'
              } ${deletingId === person.id ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center shrink-0">
                  <User size={20} className="text-zinc-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium truncate">{person.name}</h3>
                    {!person.isActive && (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-400 rounded-full">
                        {t('persons.inactive')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-zinc-400">
                    <Phone size={12} />
                    <span dir="ltr">{person.phone}</span>
                  </div>
                  {person.dispatchCount > 0 && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                      <span>
                        {t('persons.dispatchCount', { count: person.dispatchCount })}
                      </span>
                      {person.lastDispatchedAt && (
                        <span>
                          {t('persons.lastDispatched', {
                            time: formatRelativeTime(person.lastDispatchedAt),
                          })}
                        </span>
                      )}
                    </div>
                  )}
                  {person.notes && (
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{person.notes}</p>
                  )}
                </div>

                {/* Actions Menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === person.id ? null : person.id)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    disabled={deletingId === person.id || togglingId === person.id}
                  >
                    {deletingId === person.id || togglingId === person.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <MoreVertical size={18} />
                    )}
                  </button>

                  {menuOpenId === person.id && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenId(null)}
                      />
                      {/* Menu */}
                      <div className="absolute end-0 top-full mt-1 z-20 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                        <button
                          onClick={() => {
                            setMenuOpenId(null);
                            onEdit(person);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-700 transition-colors"
                        >
                          <Edit2 size={14} />
                          {tCommon('edit')}
                        </button>
                        <button
                          onClick={() => handleToggleActive(person)}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-700 transition-colors"
                        >
                          <User size={14} />
                          {person.isActive ? t('persons.inactive') : t('persons.active')}
                        </button>
                        <button
                          onClick={() => handleDelete(person.id)}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                          {tCommon('delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
