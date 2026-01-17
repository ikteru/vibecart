'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { createClient } from '@/infrastructure/auth/supabase-client';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { DirectionalIcon } from '@/presentation/components/ui/DirectionalIcon';

/**
 * Forgot Password Page
 *
 * Allows users to request a password reset email.
 */
export default function ForgotPasswordPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setIsSent(true);
      setIsLoading(false);
    }
  };

  // Success state
  if (isSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('auth.forgotPasswordPage.emailSent')}</h1>
          <p className="text-zinc-400">
            {t('auth.forgotPasswordPage.emailSentDescription')}{' '}
            <span className="text-white">{email}</span>
          </p>
          <Link
            href={`/${locale}/auth/login`}
            className="inline-block text-emerald-400 hover:text-emerald-300"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Back Link */}
        <Link
          href={`/${locale}/auth/login`}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <DirectionalIcon icon={ArrowLeft} size={16} />
          {t('auth.backToLogin')}
        </Link>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">{t('auth.forgotPasswordPage.title')}</h1>
          <p className="mt-2 text-zinc-400">{t('auth.forgotPasswordPage.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Mail className="h-4 w-4" />
              {t('auth.email')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="block w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('auth.forgotPasswordPage.sendLink')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
