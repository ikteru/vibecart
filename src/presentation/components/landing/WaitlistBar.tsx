'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';

interface WaitlistBarProps {
  count: number;
  total: number;
}

export function WaitlistBar({ count, total }: WaitlistBarProps) {
  const t = useTranslations('landing.waitlist');
  const percentage = Math.min((count / total) * 100, 100);

  return (
    <motion.section
      className="relative border-y border-zinc-800/50 bg-zinc-900/50 px-4 py-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm font-semibold text-primary-400">
          {t('first50')}
        </p>

        {/* Progress bar */}
        <div className="mx-auto mb-3 h-3 max-w-md overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
            initial={{ width: 0 }}
            whileInView={{ width: `${percentage}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </div>

        <p className="text-sm text-zinc-400">
          <AnimatedCounter target={count} className="font-bold text-white" />
          <span> / {total} </span>
        </p>

        <p className="mt-2 text-xs text-zinc-500">
          {t('beFirst')}
        </p>
      </div>
    </motion.section>
  );
}
