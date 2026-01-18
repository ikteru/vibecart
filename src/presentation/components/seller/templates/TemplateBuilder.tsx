'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, Send, Trash2, AlertCircle, Plus, X } from 'lucide-react';
import Link from 'next/link';
import type { WhatsAppTemplateDTO, CreateTemplateDTO } from '@/application/dtos/WhatsAppTemplateDTO';
import type { TemplateCategory, TemplateLanguage, TemplateComponent, TemplateButton, ButtonType } from '@/domain/entities/WhatsAppMessageTemplate';
import { TemplatePreview } from './TemplatePreview';

interface TemplateBuilderProps {
  locale: string;
  mode: 'create' | 'edit';
  template?: WhatsAppTemplateDTO;
}

const CATEGORY_VALUES: TemplateCategory[] = ['UTILITY', 'MARKETING', 'AUTHENTICATION'];
const LANGUAGE_VALUES: TemplateLanguage[] = ['ar', 'en', 'fr'];
const BUTTON_TYPE_VALUES: ButtonType[] = ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'];

const VARIABLE_KEYS = [
  { placeholder: '{{1}}', key: 'customerName' },
  { placeholder: '{{2}}', key: 'orderNumber' },
  { placeholder: '{{3}}', key: 'totalAmount' },
  { placeholder: '{{4}}', key: 'trackingNumber' },
  { placeholder: '{{5}}', key: 'shopName' },
  { placeholder: '{{6}}', key: 'itemsCount' },
];

/**
 * Extract buttons from template components
 */
function extractButtonsFromComponents(components: TemplateComponent[]): TemplateButton[] {
  const buttonsComponent = components.find((c) => c.type === 'BUTTONS');
  return buttonsComponent?.buttons || [];
}

/**
 * Template Builder Component
 *
 * Visual composer for creating WhatsApp message templates.
 */
export function TemplateBuilder({ locale, mode, template }: TemplateBuilderProps) {
  const router = useRouter();
  const t = useTranslations('templates');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(template?.templateName || '');
  const [category, setCategory] = useState<TemplateCategory>(template?.category || 'UTILITY');
  const [language, setLanguage] = useState<TemplateLanguage>(template?.templateLanguage || 'ar');
  const [description, setDescription] = useState(template?.description || '');
  const [headerText, setHeaderText] = useState(template?.headerText || '');
  const [bodyText, setBodyText] = useState(template?.bodyText || '');
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState<TemplateButton[]>(
    template?.components ? extractButtonsFromComponents(template.components) : []
  );

  const canEdit = mode === 'create' || template?.canEdit;
  const canSubmit = template?.canSubmit;

  const addButton = () => {
    if (buttons.length >= 3) return; // Max 3 buttons per Meta rules
    setButtons([...buttons, { type: 'QUICK_REPLY', text: '' }]);
  };

  const updateButton = (index: number, updates: Partial<TemplateButton>) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], ...updates };
    setButtons(newButtons);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const buildComponents = (): TemplateComponent[] => {
    const components: TemplateComponent[] = [];

    if (headerText.trim()) {
      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: headerText.trim(),
      });
    }

    components.push({
      type: 'BODY',
      text: bodyText.trim(),
    });

    if (footerText.trim()) {
      components.push({
        type: 'FOOTER',
        text: footerText.trim(),
      });
    }

    // Add buttons if any exist with valid text
    const validButtons = buttons.filter((b) => b.text.trim());
    if (validButtons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: validButtons,
      });
    }

    return components;
  };

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError(t('errors.nameRequired'));
      return;
    }

    if (!bodyText.trim()) {
      setError(t('errors.bodyRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload: CreateTemplateDTO = {
        templateName: name.trim(),
        templateLanguage: language,
        category,
        description: description.trim() || undefined,
        components: buildComponents(),
      };

      const url = mode === 'create'
        ? '/api/whatsapp/templates'
        : `/api/whatsapp/templates/${template?.id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('errors.saveFailed'));
        return;
      }

      router.push(`/${locale}/seller/templates`);
      router.refresh();
    } catch {
      setError(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!template?.id) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/whatsapp/templates/${template.id}/submit`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('errors.submitFailed'));
        return;
      }

      router.push(`/${locale}/seller/templates`);
      router.refresh();
    } catch {
      setError(t('errors.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!template?.id) return;
    if (!confirm(t('deleteConfirm'))) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/whatsapp/templates/${template.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push(`/${locale}/seller/templates`);
        router.refresh();
      }
    } finally {
      setDeleting(false);
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
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">
            {mode === 'create' ? t('newTemplate') : t('editTemplate')}
          </h2>
          {template && (
            <span
              className={`text-[10px] uppercase px-2 py-0.5 rounded ${
                template.status === 'APPROVED'
                  ? 'bg-emerald-600'
                  : template.status === 'PENDING'
                  ? 'bg-yellow-600'
                  : template.status === 'REJECTED'
                  ? 'bg-red-600'
                  : 'bg-zinc-600'
              }`}
            >
              {t(`status.${template.status.toLowerCase()}`)}
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Rejection Reason */}
      {template?.rejectionReason && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm">
          <div className="text-red-400 font-medium mb-1">{t('rejectionReason')}:</div>
          <div className="text-red-300">{template.rejectionReason}</div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{t('form.templateName')} {t('form.required')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              disabled={!canEdit}
              placeholder={t('form.templateNamePlaceholder')}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none disabled:opacity-50"
            />
            <p className="text-[10px] text-zinc-600 mt-1">{t('form.templateNameHint')}</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{t('form.category')} {t('form.required')}</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_VALUES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => canEdit && setCategory(cat)}
                  disabled={!canEdit}
                  className={`p-2 rounded-lg text-center transition-colors disabled:opacity-50 ${
                    category === cat
                      ? 'bg-zinc-700 border border-zinc-600'
                      : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-medium text-white">{t(`categories.${cat.toLowerCase()}`)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{t('form.language')} {t('form.required')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as TemplateLanguage)}
              disabled={!canEdit}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none disabled:opacity-50"
            >
              {LANGUAGE_VALUES.map((lang) => (
                <option key={lang} value={lang}>
                  {t(`languages.${lang === 'ar' ? 'arabic' : lang === 'en' ? 'english' : 'french'}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{t('form.description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              placeholder={t('form.descriptionPlaceholder')}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Header */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{t('form.header')}</label>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              disabled={!canEdit}
              placeholder={t('form.headerPlaceholder')}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">{t('form.bodyText')} {t('form.required')}</label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              disabled={!canEdit}
              placeholder={t('form.bodyPlaceholder')}
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none resize-none disabled:opacity-50"
            />
          </div>

          {/* Variables Help */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className="text-[10px] text-zinc-500 uppercase mb-2">{t('variables.title')}</div>
            <div className="grid grid-cols-2 gap-2">
              {VARIABLE_KEYS.map((v) => (
                <button
                  key={v.placeholder}
                  onClick={() => canEdit && setBodyText((prev) => prev + v.placeholder)}
                  disabled={!canEdit}
                  className="text-left p-2 bg-zinc-950 rounded text-xs hover:bg-zinc-800 disabled:opacity-50"
                >
                  <span className="text-emerald-400 font-mono">{v.placeholder}</span>
                  <span className="text-zinc-500 ml-2">{t(`variables.${v.key}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-zinc-400">{t('buttons.title')}</div>
                <div className="text-[10px] text-zinc-600">{t('buttons.maxHint')}</div>
              </div>
              {canEdit && buttons.length < 3 && (
                <button
                  onClick={addButton}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  <Plus size={14} /> {t('buttons.addButton')}
                </button>
              )}
            </div>

            {buttons.length === 0 ? (
              <div className="text-center py-4 text-zinc-600 text-xs">
                {t('buttons.noButtons')}
              </div>
            ) : (
              <div className="space-y-2">
                {buttons.map((button, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-zinc-950 rounded-lg"
                  >
                    <select
                      value={button.type}
                      onChange={(e) => updateButton(index, { type: e.target.value as ButtonType })}
                      disabled={!canEdit}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none disabled:opacity-50"
                    >
                      {BUTTON_TYPE_VALUES.map((bt) => (
                        <option key={bt} value={bt}>
                          {t(`buttons.types.${bt === 'QUICK_REPLY' ? 'quickReply' : bt === 'URL' ? 'url' : 'phone'}`)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={button.text}
                      onChange={(e) => updateButton(index, { text: e.target.value })}
                      disabled={!canEdit}
                      placeholder={t('buttons.buttonText')}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none disabled:opacity-50"
                    />
                    {button.type === 'URL' && (
                      <input
                        type="text"
                        value={button.url || ''}
                        onChange={(e) => updateButton(index, { url: e.target.value })}
                        disabled={!canEdit}
                        placeholder={t('buttons.urlPlaceholder')}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none disabled:opacity-50"
                      />
                    )}
                    {canEdit && (
                      <button
                        onClick={() => removeButton(index)}
                        className="p-1 text-zinc-500 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-xs text-zinc-400 mb-2">{t('preview')}</label>
          <TemplatePreview
            headerText={headerText}
            bodyText={bodyText}
            footerText={footerText}
            buttons={buttons}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-zinc-950/90 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          {mode === 'edit' && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-3 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>
          )}
          <div className="flex-1" />
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-zinc-700 disabled:opacity-50"
            >
              <Save size={16} />
              {t('saveDraft')}
            </button>
          )}
          {mode === 'edit' && canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-500 disabled:opacity-50"
            >
              <Send size={16} />
              {t('submitToMeta')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
