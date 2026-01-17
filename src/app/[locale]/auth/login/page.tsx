'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/presentation/providers/AuthProvider';
import { Phone, Mail, Chrome, ArrowLeft, Loader2 } from 'lucide-react';
import { DirectionalIcon } from '@/presentation/components/ui/DirectionalIcon';

type AuthMethod = 'select' | 'phone' | 'email' | 'otp';

function LoginContent() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || `/${locale}/seller/dashboard`;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signInWithEmail, signInWithPhone, verifyOTP, signInWithGoogle, signUp } = useAuth();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Phone auth state
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Email auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Format phone for Morocco (+212)
    const formattedPhone = phone.startsWith('+') ? phone : `+212${phone.replace(/^0/, '')}`;

    const { error } = await signInWithPhone(formattedPhone);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setAuthMethod('otp');
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formattedPhone = phone.startsWith('+') ? phone : `+212${phone.replace(/^0/, '')}`;
    const { error } = await verifyOTP(formattedPhone, otpCode);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      // Use full page navigation to ensure cookies are sent
      window.location.href = redirectTo;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setError(t('auth.checkEmail'));
      }
      setIsLoading(false);
    } else {
      const { data, error } = await signInWithEmail(email, password);
      if (error) {
        setError(error.message);
        setIsLoading(false);
      } else if (data?.session) {
        // Session established - use full page navigation to ensure cookies are sent
        window.location.href = redirectTo;
      } else {
        setError(t('errors.serverError'));
        setIsLoading(false);
      }
    }
  };

  const handleComingSoonClick = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  const goBack = () => {
    if (authMethod === 'otp') {
      setAuthMethod('phone');
      setOtpCode('');
    } else {
      setAuthMethod('select');
      setError(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">{t('auth.login')}</h1>
          <p className="mt-2 text-zinc-400">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Auth Options */}
        {authMethod === 'select' && (
          <div className="space-y-4">
            {/* Phone OTP - Coming Soon */}
            <button
              onClick={handleComingSoonClick}
              className="flex w-full items-center gap-4 rounded-xl bg-green-600/50 px-6 py-4 text-lg font-semibold text-white transition-all cursor-not-allowed"
            >
              <Phone className="h-6 w-6" />
              {t('auth.continueWithPhone')}
              <span className="ml-auto text-xs text-green-200">{t('common.comingSoon')}</span>
            </button>

            {/* Email/Password */}
            <button
              onClick={() => setAuthMethod('email')}
              className="flex w-full items-center gap-4 rounded-xl bg-zinc-800 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-zinc-700 active:scale-[0.98]"
            >
              <Mail className="h-6 w-6" />
              {t('auth.continueWithEmail')}
            </button>

            {/* Google OAuth - Coming Soon */}
            <button
              onClick={handleComingSoonClick}
              className="flex w-full items-center gap-4 rounded-xl bg-white/60 px-6 py-4 text-lg font-semibold text-zinc-900 transition-all cursor-not-allowed"
            >
              <Chrome className="h-6 w-6" />
              {t('auth.continueWithGoogle')}
              <span className="ml-auto text-xs text-zinc-500">{t('common.comingSoon')}</span>
            </button>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Phone Number Input */}
        {authMethod === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 text-zinc-400 hover:text-white"
            >
              <DirectionalIcon icon={ArrowLeft} size={16} />
              {t('common.back')}
            </button>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-300">
                {t('auth.phoneNumber')}
              </label>
              <div className="mt-1 flex">
                <span className="inline-flex items-center rounded-s-lg border border-e-0 border-zinc-700 bg-zinc-800 px-3 text-zinc-400">
                  +212
                </span>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="6XX XXX XXX"
                  className="block w-full rounded-e-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-zinc-500">{t('auth.phoneHint')}</p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-green-700 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t('auth.sendCode')
              )}
            </button>
          </form>
        )}

        {/* OTP Verification */}
        {authMethod === 'otp' && (
          <form onSubmit={handleOTPSubmit} className="space-y-4">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 text-zinc-400 hover:text-white"
            >
              <DirectionalIcon icon={ArrowLeft} size={16} />
              {t('common.back')}
            </button>

            <div className="text-center">
              <p className="text-zinc-300">
                {t('auth.codeSentTo')} <span className="font-medium text-white">+212{phone}</span>
              </p>
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-zinc-300">
                {t('auth.verificationCode')}
              </label>
              <input
                type="text"
                id="otp"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-2xl tracking-widest text-white placeholder-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || otpCode.length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-green-700 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t('auth.verify')
              )}
            </button>
          </form>
        )}

        {/* Email/Password Form */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 text-zinc-400 hover:text-white"
            >
              <DirectionalIcon icon={ArrowLeft} size={16} />
              {t('common.back')}
            </button>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                {t('auth.email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                {t('auth.password')}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                minLength={6}
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
              {!isSignUp && (
                <div className="mt-2 text-end">
                  <Link
                    href={`/${locale}/auth/forgot-password`}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
              )}
            </div>

            {error && (
              <div className={`rounded-lg px-4 py-3 text-sm ${
                error === t('auth.checkEmail')
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-600 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isSignUp ? (
                t('auth.createAccount')
              ) : (
                t('auth.signIn')
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Coming Soon Toast */}
      {showComingSoon && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4">
          {t('common.featureComingSoon', { feature: t('auth.continueWithGoogle').split(' ').slice(-1)[0] })}
        </div>
      )}
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
