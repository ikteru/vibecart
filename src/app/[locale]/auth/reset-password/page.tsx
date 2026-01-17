'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/infrastructure/auth/supabase-client';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

/**
 * Reset Password Page
 *
 * Allows users to set a new password after clicking the reset link.
 */
export default function ResetPasswordPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('auth.resetPassword.errors.mismatch'));
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError(t('auth.resetPassword.errors.tooShort'));
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push(`/${locale}/seller/dashboard`);
      }, 2000);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('auth.resetPassword.success')}</h1>
          <p className="text-zinc-400">{t('auth.resetPassword.redirecting')}</p>
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('auth.resetPassword.title')}</h1>
          <p className="mt-2 text-zinc-400">{t('auth.resetPassword.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label htmlFor="password" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Lock className="h-4 w-4" />
              {t('auth.resetPassword.newPassword')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              minLength={6}
              className="block w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Lock className="h-4 w-4" />
              {t('auth.resetPassword.confirmPassword')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              minLength={6}
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
              t('auth.resetPassword.updatePassword')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
