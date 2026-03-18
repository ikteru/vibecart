'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Play, Smartphone, MessageSquare, MessageCircle, BarChart3 } from 'lucide-react';

const FEATURES = [
  { icon: Smartphone, gradient: 'from-emerald-500 to-emerald-400' },
  { icon: MessageSquare, gradient: 'from-pink-500 to-rose-400' },
  { icon: MessageCircle, gradient: 'from-green-500 to-green-400' },
  { icon: BarChart3, gradient: 'from-blue-500 to-cyan-400' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

export function FeaturesSection() {
  const t = useTranslations('landing.features');

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

        {/* Featured: Shoppable Videos — full-width card with inline visual */}
        <motion.div
          className="mb-4 overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 transition-colors hover:border-zinc-700"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            {/* Visual: mini reel with price tag */}
            <div className="relative w-[140px] shrink-0">
              <div className="aspect-[3/4] rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden">
                {/* Reel content */}
                <div className="flex h-full items-center justify-center">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-pink-500/20 to-primary-500/20" />
                </div>
                {/* Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="h-4 w-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    <span className="text-[8px] text-white/80 font-semibold" dir="ltr">@shop</span>
                  </div>
                </div>
                {/* Price tag */}
                <motion.div
                  className="absolute top-3 end-3"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  <span className="rounded-full bg-primary-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                    199 MAD
                  </span>
                </motion.div>
                {/* Play icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                    <Play size={16} className="text-white fill-white ms-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="text-center sm:text-start">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-400 shadow-lg sm:mb-2`}>
                <Play size={20} className="text-white" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">{t('f1.title')}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{t('f1.desc')}</p>
            </div>
          </div>
        </motion.div>

        {/* Other features: 2x2 grid */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            const featureIndex = i + 2; // f2, f3, f4, f5

            return (
              <motion.div
                key={i}
                variants={item}
                className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5 transition-colors hover:border-zinc-700"
                style={{ minHeight: '160px' }}
              >
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <motion.div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feat.gradient} shadow-lg`}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Icon size={24} className="text-white" />
                  </motion.div>
                  <h3 className="text-sm font-bold text-white text-center">{t(`f${featureIndex}.title`)}</h3>
                  <p className="text-[11px] leading-relaxed text-zinc-500 text-center">{t(`f${featureIndex}.desc`)}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
