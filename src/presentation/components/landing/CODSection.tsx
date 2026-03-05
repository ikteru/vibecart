'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Banknote, Shield, Truck } from 'lucide-react';

export function CODSection() {
  const t = useTranslations('landing.cod');

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Icon */}
          <motion.div
            className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-green-500/10 ring-4 ring-green-500/20"
            whileInView={{
              rotate: [0, -5, 5, -5, 0],
            }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <Banknote size={44} className="text-green-400" />
          </motion.div>

          <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            {t('title')}
          </h2>

          <p className="mb-3 text-xl font-medium text-zinc-400">
            {t('subtitle')}
          </p>

          <p className="text-sm text-zinc-500">
            {t('desc')}
          </p>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: Banknote, label: 'Cash on Delivery' },
              { icon: Shield, label: 'Secure' },
              { icon: Truck, label: 'Fast Delivery' },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 rounded-full bg-zinc-800/50 px-4 py-2 text-xs text-zinc-400"
              >
                <badge.icon size={14} className="text-green-400" />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
