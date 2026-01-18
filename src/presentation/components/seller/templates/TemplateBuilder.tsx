'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

const CATEGORIES: { value: TemplateCategory; label: string; description: string }[] = [
  { value: 'UTILITY', label: 'Utility', description: 'Order updates, confirmations, alerts' },
  { value: 'MARKETING', label: 'Marketing', description: 'Promotions, offers, newsletters' },
  { value: 'AUTHENTICATION', label: 'Authentication', description: 'OTPs, verification codes' },
];

const LANGUAGES: { value: TemplateLanguage; label: string }[] = [
  { value: 'ar', label: 'Arabic' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
];

const VARIABLE_HELP = [
  { placeholder: '{{1}}', name: 'Customer Name', example: 'Ahmed' },
  { placeholder: '{{2}}', name: 'Order Number', example: 'ORD-A1B2' },
  { placeholder: '{{3}}', name: 'Total Amount', example: '450 MAD' },
  { placeholder: '{{4}}', name: 'Tracking Number', example: 'MA123456' },
  { placeholder: '{{5}}', name: 'Shop Name', example: 'Zara Shop' },
  { placeholder: '{{6}}', name: 'Items Count', example: '3' },
];

const BUTTON_TYPES: { value: ButtonType; label: string }[] = [
  { value: 'QUICK_REPLY', label: 'Quick Reply' },
  { value: 'URL', label: 'URL' },
  { value: 'PHONE_NUMBER', label: 'Phone' },
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
      setError('Template name is required');
      return;
    }

    if (!bodyText.trim()) {
      setError('Body text is required');
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
        setError(data.error || 'Failed to save template');
        return;
      }

      router.push(`/${locale}/seller/templates`);
      router.refresh();
    } catch {
      setError('Failed to save template');
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
        setError(data.error || 'Failed to submit template');
        return;
      }

      router.push(`/${locale}/seller/templates`);
      router.refresh();
    } catch {
      setError('Failed to submit template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!template?.id) return;
    if (!confirm('Are you sure you want to delete this template?')) return;

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
            {mode === 'create' ? 'New Template' : 'Edit Template'}
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
              {template.status}
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
          <div className="text-red-400 font-medium mb-1">Rejection Reason:</div>
          <div className="text-red-300">{template.rejectionReason}</div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Template Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              disabled={!canEdit}
              placeholder="order_confirmation"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none disabled:opacity-50"
            />
            <p className="text-[10px] text-zinc-600 mt-1">Lowercase letters, numbers, underscores only</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => canEdit && setCategory(cat.value)}
                  disabled={!canEdit}
                  className={`p-2 rounded-lg text-center transition-colors disabled:opacity-50 ${
                    category === cat.value
                      ? 'bg-zinc-700 border border-zinc-600'
                      : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-medium text-white">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Language *</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as TemplateLanguage)}
              disabled={!canEdit}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              placeholder="Brief description for your reference"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Header */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Header (optional)</label>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              disabled={!canEdit}
              placeholder="Order Update"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Body Text *</label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              disabled={!canEdit}
              placeholder="Hello {{1}}! Your order {{2}} has been confirmed. Total: {{3}}"
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-zinc-600 focus:outline-none resize-none disabled:opacity-50"
            />
          </div>

          {/* Variables Help */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className="text-[10px] text-zinc-500 uppercase mb-2">Available Variables</div>
            <div className="grid grid-cols-2 gap-2">
              {VARIABLE_HELP.map((v) => (
                <button
                  key={v.placeholder}
                  onClick={() => canEdit && setBodyText((prev) => prev + v.placeholder)}
                  disabled={!canEdit}
                  className="text-left p-2 bg-zinc-950 rounded text-xs hover:bg-zinc-800 disabled:opacity-50"
                >
                  <span className="text-emerald-400 font-mono">{v.placeholder}</span>
                  <span className="text-zinc-500 ml-2">{v.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-zinc-400">Quick Reply Buttons</div>
                <div className="text-[10px] text-zinc-600">Max 3 buttons per template</div>
              </div>
              {canEdit && buttons.length < 3 && (
                <button
                  onClick={addButton}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  <Plus size={14} /> Add Button
                </button>
              )}
            </div>

            {buttons.length === 0 ? (
              <div className="text-center py-4 text-zinc-600 text-xs">
                No buttons added. Buttons let customers respond with one tap.
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
                      {BUTTON_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value}>
                          {bt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={button.text}
                      onChange={(e) => updateButton(index, { text: e.target.value })}
                      disabled={!canEdit}
                      placeholder="Button text"
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none disabled:opacity-50"
                    />
                    {button.type === 'URL' && (
                      <input
                        type="text"
                        value={button.url || ''}
                        onChange={(e) => updateButton(index, { url: e.target.value })}
                        disabled={!canEdit}
                        placeholder="https://..."
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
          <label className="block text-xs text-zinc-400 mb-2">Preview</label>
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
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          {mode === 'edit' && canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-500 disabled:opacity-50"
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit to Meta'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
