'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export function SolutionSection({ onCtaClick }: { onCtaClick: () => void }) {
  const t = useTranslations('landing.solution');

  const solutions = Array.from({ length: 8 }, (_, i) => ({
    key: `s${i + 1}`,
    pain: t(`s${i + 1}.pain`),
    fix: t(`s${i + 1}.fix`),
  }));

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          className="mb-12 text-center text-3xl font-extrabold text-white sm:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('title')}
        </motion.h2>

        {/* Table header */}
        <div className="mb-4 flex items-center gap-4 px-4 text-xs font-semibold">
          <span className="flex-1 text-zinc-600">{t('painLabel')}</span>
          <span className="flex-1 text-primary-400">{t('fixLabel')}</span>
        </div>

        {/* Solution rows */}
        <motion.div
          className="space-y-2"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {solutions.map((sol) => (
            <motion.div
              key={sol.key}
              variants={item}
              className="flex items-start gap-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4"
            >
              <div className="flex-1">
                <p className="text-sm text-zinc-500 line-through decoration-zinc-700">{sol.pain}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{sol.fix}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mid-page CTA */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.button
            onClick={onCtaClick}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('cta')} →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
