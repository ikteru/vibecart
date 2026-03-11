'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { validateAndFormatPhone } from '@/presentation/validation/checkoutSchema';

interface CustomerLoginProps {
  shopHandle: string;
  redirectUrl: string;
  onLoginSuccess?: () => void;
}

type LoginState = 'idle' | 'sending' | 'sent' | 'error';

/**
 * CustomerLogin
 *
 * WhatsApp magic link login form for customers.
 * Shows a phone input, sends a login link via WhatsApp, and prompts
 * the customer to check their messages.
 */
export function CustomerLogin({ redirectUrl }: CustomerLoginProps) {
  const t = useTranslations('customer.login');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<LoginState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = useCallback((value: string) => {
    // Only allow digits, format with spaces
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 9);
    const formatted = limited.replace(
      /(\d{1})(\d{2})?(\d{2})?(\d{2})?(\d{2})?/,
      (_, a, b, c, d, e) => [a, b, c, d, e].filter(Boolean).join(' ')
    );
    setPhone(formatted);
    if (state === 'error') {
      setState('idle');
      setError(null);
    }
  }, [state]);

  const handleSubmit = useCallback(async () => {
    // Validate phone
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 9) {
      setError(t('invalidPhone'));
      setState('error');
      return;
    }

    const result = validateAndFormatPhone(cleaned);
    if (!result.valid) {
      setError(t('invalidPhone'));
      setState('error');
      return;
    }

    setState('sending');
    setError(null);

    try {
      const response = await fetch('/api/auth/customer/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleaned,
          redirectUrl,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setError(t('tooManyAttempts'));
        setState('error');
        return;
      }

      if (!data.success) {
        setError(data.error || t('error'));
        setState('error');
        return;
      }

      setState('sent');
    } catch {
      setError(t('error'));
      setState('error');
    }
  }, [phone, redirectUrl, t]);

  // Success state — link sent
  if (state === 'sent') {
    return (
      <div className="flex flex-col items-center text-center px-6 py-8 animate-fade-in">
        <div className="relative mb-5">
          <div className="absolute inset-0 w-20 h-20 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{t('linkSent')}</h3>
        <p className="text-sm text-zinc-400 max-w-[260px] leading-relaxed mb-6">
          {t('linkSentHint')}
        </p>

        <button
          onClick={() => {
            setState('idle');
            setPhone('');
          }}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  // Login form
  return (
    <div className="flex flex-col items-center px-6 py-8">
      {/* WhatsApp icon */}
      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-5">
        <MessageSquare size={28} className="text-emerald-400" />
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{t('title')}</h3>
      <p className="text-sm text-zinc-500 text-center mb-6 max-w-[260px]">
        {t('subtitle')}
      </p>

      {/* Phone input */}
      <div className="w-full max-w-xs space-y-3">
        <div
          dir="ltr"
          className={`flex items-center h-[52px] bg-zinc-900 border rounded-xl overflow-hidden transition-colors ${
            error
              ? 'border-red-500/50'
              : 'border-zinc-800 focus-within:border-emerald-500/50'
          }`}
        >
          <div className="h-full px-3 bg-zinc-800/50 flex items-center gap-1.5 border-e border-zinc-700/50">
            <span className="text-base">🇲🇦</span>
            <span className="text-white font-bold text-sm">+212</span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="6 12 34 56 78"
            className="flex-1 h-full bg-transparent px-3 text-white text-base font-medium tracking-wider placeholder-zinc-600 focus:outline-none"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            disabled={state === 'sending'}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs px-1">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={state === 'sending' || phone.replace(/\s/g, '').length < 9}
          className="w-full h-[48px] bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {state === 'sending' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t('sending')}
            </>
          ) : (
            <>
              <MessageSquare size={16} />
              {t('sendLink')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
