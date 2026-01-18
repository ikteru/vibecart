'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, FileText, Clock, CheckCircle2, XCircle, RefreshCw, Settings2, Sparkles } from 'lucide-react';
import type { WhatsAppTemplateSummaryDTO, TemplateStatsDTO } from '@/application/dtos/WhatsAppTemplateDTO';
import type { TemplateStatus } from '@/domain/entities/WhatsAppMessageTemplate';

interface TemplateListProps {
  initialTemplates: WhatsAppTemplateSummaryDTO[];
  stats?: TemplateStatsDTO;
  locale: string;
}

const STATUS_STYLE: Record<TemplateStatus, { color: string; icon: React.ReactNode }> = {
  DRAFT: { color: 'bg-zinc-600', icon: <FileText size={12} /> },
  PENDING: { color: 'bg-yellow-600', icon: <Clock size={12} /> },
  APPROVED: { color: 'bg-emerald-600', icon: <CheckCircle2 size={12} /> },
  REJECTED: { color: 'bg-red-600', icon: <XCircle size={12} /> },
};

/**
 * Template List Client Component
 *
 * Displays templates with status badges and quick actions.
 */
export function TemplateList({ initialTemplates, stats, locale }: TemplateListProps) {
  const router = useRouter();
  const t = useTranslations('templates');
  const [templates] = useState(initialTemplates);
  const [filter, setFilter] = useState<TemplateStatus | 'ALL'>('ALL');
  const [syncing, setSyncing] = useState(false);

  const getStatusLabel = (status: TemplateStatus) => t(`status.${status.toLowerCase()}`);
  const getCategoryLabel = (category: string) => t(`categories.${category.toLowerCase()}`);

  const filteredTemplates = filter === 'ALL'
    ? templates
    : templates.filter((tpl) => tpl.status === filter);

  const syncTemplates = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/whatsapp/templates/sync', { method: 'POST' });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">{t('title')}</h2>
          <p className="text-xs text-zinc-500 mt-1">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={syncTemplates}
            disabled={syncing}
            className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white disabled:opacity-50"
            title={t('syncFromMeta')}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          </button>
          <Link
            href={`/${locale}/seller/templates/bindings`}
            className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
            title={t('eventBindings')}
          >
            <Settings2 size={16} />
          </Link>
          <Link
            href={`/${locale}/seller/templates/new`}
            className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
          >
            <Plus size={14} /> {t('newTemplate')}
          </Link>
        </div>
      </div>

      {/* Quick Start Banner */}
      <Link
        href={`/${locale}/seller/templates/presets`}
        className="block mb-6 p-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-800/50 rounded-xl hover:border-yellow-600/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <Sparkles size={20} className="text-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="text-yellow-400 text-sm font-medium">
              {t('quickStart')}
            </div>
            <p className="text-yellow-300/60 text-xs">
              {t('quickStartDesc')}
            </p>
          </div>
          <div className="text-yellow-500 text-xs font-medium">
            {t('browse')} →
          </div>
        </div>
      </Link>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => setFilter('ALL')}
            className={`p-3 rounded-xl text-center transition-colors ${
              filter === 'ALL' ? 'bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            <div className="text-lg font-bold text-white">{stats.total}</div>
            <div className="text-[10px] text-zinc-500 uppercase">{t('stats.total')}</div>
          </button>
          <button
            onClick={() => setFilter('DRAFT')}
            className={`p-3 rounded-xl text-center transition-colors ${
              filter === 'DRAFT' ? 'bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            <div className="text-lg font-bold text-zinc-400">{stats.draft}</div>
            <div className="text-[10px] text-zinc-500 uppercase">{t('stats.draft')}</div>
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`p-3 rounded-xl text-center transition-colors ${
              filter === 'PENDING' ? 'bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            <div className="text-lg font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-[10px] text-zinc-500 uppercase">{t('stats.pending')}</div>
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`p-3 rounded-xl text-center transition-colors ${
              filter === 'APPROVED' ? 'bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            <div className="text-lg font-bold text-emerald-500">{stats.approved}</div>
            <div className="text-[10px] text-zinc-500 uppercase">{t('stats.approved')}</div>
          </button>
        </div>
      )}

      {/* Template List */}
      {filteredTemplates.length === 0 ? (
        <div className="py-10 text-center">
          <FileText size={40} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-500 text-sm">
            {filter === 'ALL' ? t('noTemplates') : t('noFilterTemplates', { filter: getStatusLabel(filter) })}
          </p>
          {filter === 'ALL' && (
            <div className="flex flex-col items-center gap-3 mt-4">
              <Link
                href={`/${locale}/seller/templates/presets`}
                className="inline-flex items-center gap-1 text-yellow-400 text-sm hover:underline"
              >
                <Sparkles size={14} /> {t('usePreset')}
              </Link>
              <span className="text-zinc-600 text-xs">{t('or')}</span>
              <Link
                href={`/${locale}/seller/templates/new`}
                className="inline-flex items-center gap-1 text-zinc-400 text-sm hover:underline"
              >
                <Plus size={14} /> {t('createFromScratch')}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTemplates.map((template) => {
            const statusStyle = STATUS_STYLE[template.status];
            return (
              <Link
                key={template.id}
                href={`/${locale}/seller/templates/${template.id}/edit`}
                className="block bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-white">{template.templateName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-500 uppercase">
                        {getCategoryLabel(template.category)}
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span className="text-[10px] text-zinc-500 uppercase">
                        {template.templateLanguage}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`${statusStyle.color} px-2 py-0.5 rounded text-[10px] font-medium text-white flex items-center gap-1`}
                  >
                    {statusStyle.icon}
                    {getStatusLabel(template.status)}
                  </span>
                </div>
                {template.description && (
                  <p className="text-xs text-zinc-500 mb-2 line-clamp-1">
                    {template.description}
                  </p>
                )}
                <p className="text-xs text-zinc-400 line-clamp-2 bg-zinc-950 rounded p-2 font-mono">
                  {template.bodyPreview}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
