'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Settings, Plus, X, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import type { ShippingConfig, ShippingRule } from '@/domain/entities/Seller';

interface ShippingFormProps {
  locale: string;
  initialShipping?: ShippingConfig;
  updateAction: (shipping: ShippingConfig) => Promise<{ success: boolean; error?: string }>;
}

// Common Moroccan cities
const COMMON_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fes',
  'Tangier',
  'Agadir',
  'Meknes',
  'Oujda',
  'Kenitra',
  'Tetouan',
];

export function ShippingForm({ locale, initialShipping, updateAction }: ShippingFormProps) {
  const t = useTranslations('shipping');
  const tCities = useTranslations('cities');
  const tCurrency = useTranslations('currency');

  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [defaultRate, setDefaultRate] = useState(initialShipping?.defaultRate ?? 35);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    initialShipping?.freeShippingThreshold ?? 500
  );
  const [rules, setRules] = useState<ShippingRule[]>(initialShipping?.rules ?? []);

  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleCity, setNewRuleCity] = useState('');
  const [newRuleRate, setNewRuleRate] = useState('');

  const handleAddRule = () => {
    if (!newRuleCity || !newRuleRate) return;

    const rate = parseFloat(newRuleRate);
    if (isNaN(rate)) return;

    // Check if city already has a rule
    if (rules.some((r) => r.city.toLowerCase() === newRuleCity.toLowerCase())) {
      setError('This city already has a shipping rule');
      return;
    }

    setRules([...rules, { city: newRuleCity, rate }]);
    setNewRuleCity('');
    setNewRuleRate('');
    setShowAddRule(false);
    setError(null);
  };

  const handleRemoveRule = (cityToRemove: string) => {
    setRules(rules.filter((r) => r.city !== cityToRemove));
  };

  const handleSave = () => {
    setError(null);

    const shippingConfig: ShippingConfig = {
      defaultRate,
      freeShippingThreshold: freeShippingThreshold > 0 ? freeShippingThreshold : undefined,
      rules: rules.length > 0 ? rules : undefined,
    };

    startTransition(async () => {
      const result = await updateAction(shippingConfig);

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        setError(result.error || 'Failed to save shipping settings');
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
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
          <p className="text-zinc-400">{t('pageDescription')}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            Settings saved successfully
          </div>
        )}

        {/* Current Shipping Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">{t('currentSettings')}</h2>
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Default Rate */}
              <div>
                <label className="block text-zinc-500 text-sm mb-2">{t('defaultRate')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={defaultRate}
                    onChange={(e) => setDefaultRate(parseFloat(e.target.value) || 0)}
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
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <span className="text-zinc-400 text-sm">{tCurrency('MAD_symbol')}</span>
                </div>
              </div>
            </div>

            {/* City-specific Rules */}
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">{t('cityRules')}</h3>
                <button
                  onClick={() => setShowAddRule(true)}
                  className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-sm hover:bg-violet-500/30 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {t('addRule')}
                </button>
              </div>

              {/* Add Rule Form */}
              {showAddRule && (
                <div className="mb-4 p-4 rounded-xl bg-zinc-800/50 space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={newRuleCity}
                      onChange={(e) => setNewRuleCity(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                      <option value="">Select city...</option>
                      {COMMON_CITIES.filter((city) => !rules.some((r) => r.city === city)).map(
                        (city) => (
                          <option key={city} value={city}>
                            {tCities(city)}
                          </option>
                        )
                      )}
                    </select>
                    <input
                      type="number"
                      value={newRuleRate}
                      onChange={(e) => setNewRuleRate(e.target.value)}
                      placeholder="Rate"
                      className="w-24 px-3 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    <span className="flex items-center text-zinc-400 text-sm">
                      {tCurrency('MAD_symbol')}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowAddRule(false)}
                      className="px-3 py-1.5 rounded-lg text-zinc-400 text-sm hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddRule}
                      disabled={!newRuleCity || !newRuleRate}
                      className="px-3 py-1.5 rounded-lg bg-violet-500 text-white text-sm hover:bg-violet-600 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Rules List */}
              <div className="space-y-2">
                {rules.length === 0 ? (
                  <p className="text-zinc-500 text-sm py-4 text-center">
                    No city-specific rules. Default rate will be used for all cities.
                  </p>
                ) : (
                  rules.map((rule) => (
                    <div
                      key={rule.city}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 group"
                    >
                      <span className="text-white text-sm">{tCities(rule.city)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 text-sm">
                          {rule.rate} {tCurrency('MAD_symbol')}
                        </span>
                        <button
                          onClick={() => handleRemoveRule(rule.city)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('saveSettings')}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
