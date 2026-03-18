'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

const PAIN_EMOJIS = ['📩', '📓', '👻', '💸', '📱', '🤷', '📊', '😤'];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function PainPointsSection() {
  const t = useTranslations('landing.pain');

  const painPoints = Array.from({ length: 8 }, (_, i) => ({
    key: `p${i + 1}`,
    emoji: PAIN_EMOJIS[i],
    title: t(`p${i + 1}.title`),
    desc: t(`p${i + 1}.desc`),
  }));

  return (
    <section className="bg-zinc-900/30 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          className="mb-12 text-center text-3xl font-extrabold text-white sm:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('title')}
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {painPoints.map((pain) => (
            <motion.div
              key={pain.key}
              variants={item}
              className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700"
            >
              <span className="mb-2 block text-2xl">{pain.emoji}</span>
              <h3 className="mb-1 text-sm font-bold text-white">{pain.title}</h3>
              <p className="text-xs leading-relaxed text-zinc-500">{pain.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
