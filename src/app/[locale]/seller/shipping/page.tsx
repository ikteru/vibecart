import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ComingSoonBanner } from '@/presentation/components/shipping/ComingSoonBanner';
import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';

interface ShippingPageProps {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: ShippingPageProps) {
  const t = await getTranslations({ locale, namespace: 'shipping' });

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function ShippingPage({ params: { locale } }: ShippingPageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('shipping');
  const tCities = await getTranslations('cities');
  const tCurrency = await getTranslations('currency');

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header - Back button fixed on LEFT side regardless of RTL */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-center relative">
          <Link
            href={`/${locale}/seller/settings`}
            className="absolute left-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 rtl-flip" />
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-violet-400" />
            <h1 className="font-semibold text-white">{t('pageTitle')}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Description */}
        <div className="mb-8">
          <p className="text-zinc-400">
            {t('pageDescription')}
          </p>
        </div>

        {/* Current Shipping Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t('currentSettings')}
          </h2>
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Default Rate */}
              <div>
                <label className="block text-zinc-500 text-sm mb-2">
                  {t('defaultRate')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue="35"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <span className="text-zinc-400 text-sm">{tCurrency('MAD_symbol')}</span>
                </div>
              </div>

              {/* Free Shipping Threshold */}
              <div>
                <label className="block text-zinc-500 text-sm mb-2">
                  {t('freeShippingThreshold')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue="500"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <span className="text-zinc-400 text-sm">{tCurrency('MAD_symbol')}</span>
                </div>
              </div>
            </div>

            {/* City-specific Rules */}
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">
                  {t('cityRules')}
                </h3>
                <button className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-sm hover:bg-violet-500/30 transition-colors">
                  {t('addRule')}
                </button>
              </div>

              {/* Rules List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
                  <span className="text-white text-sm">{tCities('Casablanca')}</span>
                  <span className="text-zinc-400 text-sm">25 {tCurrency('MAD_symbol')}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
                  <span className="text-white text-sm">{tCities('Rabat')}</span>
                  <span className="text-zinc-400 text-sm">30 {tCurrency('MAD_symbol')}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
                  <span className="text-white text-sm">{tCities('Marrakech')}</span>
                  <span className="text-zinc-400 text-sm">40 {tCurrency('MAD_symbol')}</span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-end">
              <button className="px-5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors">
                {t('saveSettings')}
              </button>
            </div>
          </div>
        </section>

        {/* Coming Soon - Shipping Aggregator */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            {t('aggregatorSection')}
          </h2>
          <ComingSoonBanner />
        </section>
      </main>
    </div>
  );
}
