'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { forwardRef, useState, useCallback } from 'react';
import { Check, Loader2, Instagram, MessageCircle, Link2 } from 'lucide-react';

const CITIES = ['casablanca', 'marrakech', 'rabat', 'tanger', 'agadir', 'other'] as const;

interface FinalCTASectionProps {
  signupSuccess: boolean;
}

export const FinalCTASection = forwardRef<HTMLDivElement, FinalCTASectionProps>(
  function FinalCTASection({ signupSuccess }, ref) {
    const t = useTranslations('landing.cta');
    const [instagram, setInstagram] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [city, setCity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(signupSuccess);
    const [founderNumber, setFounderNumber] = useState(238);
    const [linkCopied, setLinkCopied] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      if (!instagram.trim() || !whatsapp.trim() || !city) return;

      setIsSubmitting(true);
      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instagram: instagram.replace(/^@/, '').trim(),
            whatsapp: whatsapp.trim(),
            city,
          }),
        });
        const data = await res.json();
        setFounderNumber(data.number || 238);
        setSubmitted(true);
      } catch {
        // Silent fail — we'll handle errors later
        setSubmitted(true);
      } finally {
        setIsSubmitting(false);
      }
    }, [instagram, whatsapp, city]);

    const handleShareWhatsApp = useCallback(() => {
      const text = encodeURIComponent('Check out VibeCart — turns your Instagram into a shop! https://vibecart.codelya.ma');
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }, []);

    const handleCopyLink = useCallback(() => {
      navigator.clipboard.writeText('https://vibecart.codelya.ma');
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }, []);

    return (
      <section ref={ref} className="px-4 py-20" id="signup">
        <div className="mx-auto max-w-2xl">
          {/* Title & benefits */}
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-8 text-2xl font-extrabold text-white sm:text-3xl">
              {t('title')}
            </h2>

            <div className="space-y-2 text-start">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check size={16} className="shrink-0 text-emerald-400" />
                  <span>{t(`benefit${i}`)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {submitted ? (
            /* Success state */
            <motion.div
              className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <Check size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-2xl font-extrabold text-white">
                {t('success.title')}
              </h3>
              <p className="mt-2 text-base font-semibold text-emerald-400">
                {t('success.subtitle', { number: founderNumber })}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                {t('success.waiting')}
              </p>

              <p className="mt-6 text-xs text-zinc-500">
                {t('success.sharePrompt')}
              </p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600"
                >
                  <MessageCircle size={16} />
                  {t('success.shareWhatsApp')}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
                >
                  <Link2 size={16} />
                  {linkCopied ? '✓' : t('success.copyLink')}
                </button>
              </div>
            </motion.div>
          ) : (
            /* Signup form */
            <motion.form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur sm:p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="space-y-4">
                {/* Instagram handle */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    {t('form.instagram')}
                  </label>
                  <div className="relative">
                    <Instagram size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-pink-400" />
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder={t('form.instagramPlaceholder')}
                      className="w-full rounded-xl border border-zinc-800 bg-black py-3 pe-4 ps-10 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp number */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    {t('form.whatsapp')}
                  </label>
                  <div className="relative">
                    <MessageCircle size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-green-400" />
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder={t('form.whatsappPlaceholder')}
                      className="w-full rounded-xl border border-zinc-800 bg-black py-3 pe-4 ps-10 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    {t('form.city')}
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-black py-3 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600 appearance-none"
                    required
                  >
                    <option value="" disabled>{t('form.selectCity')}</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{t(`form.cities.${c}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isSubmitting || !instagram.trim() || !whatsapp.trim() || !city}
                className="mt-6 w-full rounded-2xl bg-primary-500 py-4 text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                  </span>
                ) : (
                  <>
                    {t('form.submit')} →
                  </>
                )}
              </motion.button>

              <p className="mt-4 text-center text-xs text-zinc-600">
                {t('belowCta')}
              </p>
            </motion.form>
          )}
        </div>
      </section>
    );
  }
);
