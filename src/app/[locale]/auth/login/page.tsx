'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, Instagram } from 'lucide-react';

function LoginContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
  const [error] = useState<string | null>(() => {
    return searchParams.get('instagram_error') || null;
  });

  const handleInstagramLogin = () => {
    setIsConnectingInstagram(true);
    window.location.href = '/api/auth/instagram/login';
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
        <div className="space-y-4">
          {/* Instagram Login - Primary CTA */}
          <button
            onClick={handleInstagramLogin}
            disabled={isConnectingInstagram}
            className="flex w-full items-center gap-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-6 py-4 text-lg font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isConnectingInstagram ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Instagram className="h-6 w-6" />
            )}
            {t('auth.continueWithInstagram')}
          </button>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>

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
