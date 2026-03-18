'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';

const CITIES = [
  { key: 'casablanca', count: 89 },
  { key: 'marrakech', count: 52 },
  { key: 'rabat', count: 41 },
  { key: 'tanger', count: 28 },
  { key: 'agadir', count: 27 },
];

export function SocialProofSection() {
  const t = useTranslations('landing.socialProof');

  return (
    <section className="bg-zinc-900/30 px-4 py-20">
      <div className="mx-auto max-w-3xl text-center">
        {/* Waitlist counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-8">
            <span className="text-5xl font-black text-white sm:text-6xl">
              +<AnimatedCounter target={237} className="" />
            </span>
            <p className="mt-2 text-sm text-zinc-400">
              {t('waitlistCount', { count: 237 })}
            </p>
          </div>

          {/* City breakdown */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
            {CITIES.map((city) => (
              <div
                key={city.key}
                className="flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400"
              >
                <span className="font-semibold text-white">{city.count}</span>
                <span>{city.key.charAt(0).toUpperCase() + city.key.slice(1)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Friction stat */}
        <motion.div
          className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <p className="mb-4 text-sm text-zinc-400">
            {t('stat', { percent: '82', buyPercent: '29' })}
          </p>
          <h3 className="text-xl font-bold text-white">{t('frictionTitle')}</h3>
          <p className="mt-1 text-base text-primary-400 font-medium">{t('frictionDesc')}</p>
        </motion.div>
      </div>
    </section>
  );
}
