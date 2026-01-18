'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Bell, BellOff, Link2, Unlink, CheckCircle2 } from 'lucide-react';
import type {
  TemplateEventBindingDTO,
  WhatsAppTemplateSummaryDTO,
} from '@/application/dtos/WhatsAppTemplateDTO';
import type { NotificationEventType } from '@/domain/entities/TemplateEventBinding';

interface EventBindingManagerProps {
  bindings: TemplateEventBindingDTO[];
  availableEvents: {
    eventType: NotificationEventType;
    label: string;
    description: string;
    hasBinding: boolean;
  }[];
  approvedTemplates: WhatsAppTemplateSummaryDTO[];
  locale: string;
}

/**
 * Event Binding Manager Component
 *
 * Assign templates to specific order notification events.
 */
export function EventBindingManager({
  bindings,
  availableEvents,
  approvedTemplates,
  locale,
}: EventBindingManagerProps) {
  const router = useRouter();
  const t = useTranslations('templates');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<NotificationEventType | null>(null);

  // Build a map of event type to binding
  const bindingMap = new Map(bindings.map((b) => [b.eventType, b]));

  const handleAssign = async (eventType: NotificationEventType, templateId: string) => {
    setUpdating(eventType);
    try {
      const response = await fetch('/api/whatsapp/templates/bindings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, templateId }),
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setUpdating(null);
      setSelectedEvent(null);
    }
  };

  const handleToggle = async (eventType: NotificationEventType, enabled: boolean) => {
    setUpdating(eventType);
    try {
      const response = await fetch('/api/whatsapp/templates/bindings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, enabled }),
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (eventType: NotificationEventType) => {
    if (!confirm(t('bindings.removeConfirm'))) return;

    setUpdating(eventType);
    try {
      const response = await fetch('/api/whatsapp/templates/bindings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, remove: true }),
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${locale}/seller/templates`}
          className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">{t('bindings.title')}</h2>
          <p className="text-xs text-zinc-500 mt-1">
            {t('bindings.description')}
          </p>
        </div>
      </div>

      {/* No Approved Templates Warning */}
      {approvedTemplates.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
          <div className="text-yellow-400 text-sm font-medium mb-1">{t('bindings.noApprovedTemplates')}</div>
          <p className="text-yellow-300/70 text-xs">
            {t('bindings.noApprovedDesc')}
          </p>
          <Link
            href={`/${locale}/seller/templates/new`}
            className="inline-block mt-2 text-yellow-400 text-xs hover:underline"
          >
            {t('bindings.createTemplate')} →
          </Link>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-3">
        {availableEvents.map((event) => {
          const binding = bindingMap.get(event.eventType);
          const isUpdating = updating === event.eventType;
          const isSelecting = selectedEvent === event.eventType;

          return (
            <div
              key={event.eventType}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
            >
              {/* Event Header */}
              <div className="p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-zinc-500" />
                    <h3 className="font-medium text-white text-sm">{event.label}</h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{event.description}</p>
                </div>

                {binding ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(event.eventType, !binding.isEnabled)}
                      disabled={isUpdating}
                      className={`p-2 rounded-lg transition-colors ${
                        binding.isEnabled
                          ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
                          : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                      }`}
                      title={binding.isEnabled ? t('bindings.disable') : t('bindings.enable')}
                    >
                      {binding.isEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                    </button>
                    <button
                      onClick={() => handleRemove(event.eventType)}
                      disabled={isUpdating}
                      className="p-2 bg-zinc-800 text-zinc-500 rounded-lg hover:text-red-400 hover:bg-red-900/30"
                      title={t('bindings.removeBinding')}
                    >
                      <Unlink size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedEvent(isSelecting ? null : event.eventType)}
                    disabled={isUpdating || approvedTemplates.length === 0}
                    className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-xs flex items-center gap-1 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
                  >
                    <Link2 size={12} />
                    {t('bindings.assign')}
                  </button>
                )}
              </div>

              {/* Bound Template Info */}
              {binding && (
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 p-2 bg-zinc-950 rounded-lg">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white font-medium truncate">
                        {binding.templateName}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {binding.isEnabled ? t('bindings.active') : t('bindings.disabled')}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEvent(event.eventType)}
                      className="text-[10px] text-zinc-500 hover:text-white"
                    >
                      {t('bindings.change')}
                    </button>
                  </div>
                </div>
              )}

              {/* Template Selection */}
              {isSelecting && (
                <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
                  <div className="text-[10px] text-zinc-500 uppercase mb-2">
                    {t('bindings.selectTemplate')}
                  </div>
                  <div className="space-y-2">
                    {approvedTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleAssign(event.eventType, template.id)}
                        disabled={isUpdating}
                        className="w-full text-left p-2 bg-zinc-950 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        <div className="text-xs text-white font-medium">
                          {template.templateName}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {template.bodyPreview}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="mt-2 text-[10px] text-zinc-500 hover:text-white"
                  >
                    {t('bindings.cancel')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
