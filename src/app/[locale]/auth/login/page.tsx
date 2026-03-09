'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, Instagram } from 'lucide-react';
import { isValidInstagramErrorCode } from '@/domain/value-objects/InstagramErrorCode';

function LoginContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read error code from URL and map to i18n, then clear URL
  useEffect(() => {
    const errorCode = searchParams.get('ig_err');
    // Legacy support: also check old param name
    const legacyError = searchParams.get('instagram_error');

    if (errorCode && isValidInstagramErrorCode(errorCode)) {
      setError(t(`auth.instagramErrors.${errorCode}`));
      router.replace(pathname, { scroll: false });
    } else if (errorCode) {
      // Unknown code — show generic error
      setError(t('auth.instagramErrors.unexpected'));
      router.replace(pathname, { scroll: false });
    } else if (legacyError) {
      setError(t('auth.instagramErrors.unexpected'));
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, router, pathname, t]);

  const handleInstagramLogin = () => {
    setIsConnectingInstagram(true);
    window.location.href = '/api/auth/instagram/login';
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Full-screen loading overlay during OAuth redirect */}
      {isConnectingInstagram && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black">
                <Instagram className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="absolute -inset-2 animate-spin rounded-2xl border-2 border-transparent border-t-pink-500" />
          </div>
          <p className="text-lg font-medium text-white">{t('auth.connectingToInstagram')}</p>
        </div>
      )}

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
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
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
