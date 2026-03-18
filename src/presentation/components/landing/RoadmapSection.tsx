'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Bot, Hash, Radio, Star, Users } from 'lucide-react';

const ROADMAP = [
  { icon: Bot, gradient: 'from-purple-500 to-violet-400' },
  { icon: Hash, gradient: 'from-primary-500 to-primary-400' },
  { icon: Radio, gradient: 'from-red-500 to-rose-400' },
  { icon: Star, gradient: 'from-yellow-500 to-amber-400' },
  { icon: Users, gradient: 'from-blue-500 to-cyan-400' },
];

export function RoadmapSection() {
  const t = useTranslations('landing.roadmap');

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          className="mb-14 text-center text-3xl font-extrabold text-white sm:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('title')}
        </motion.h2>

        {/* Desktop: horizontal timeline */}
        <div className="hidden md:block">
          <div className="relative flex items-start justify-between">
            {/* Connecting line */}
            <motion.div
              className="absolute top-7 start-7 end-7 h-[2px] bg-zinc-800"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              style={{ transformOrigin: 'left' }}
            />
            <motion.div
              className="absolute top-7 start-7 end-7 h-[2px] bg-gradient-to-r from-primary-500/40 to-transparent"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.6 }}
              style={{ transformOrigin: 'left' }}
            />

            {ROADMAP.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  className="relative z-10 flex flex-col items-center gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient} shadow-lg ring-4 ring-zinc-950`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="max-w-[120px] text-center text-xs font-bold text-white leading-tight">
                    {t(`r${i + 1}.title`)}
                  </h3>
                  <p className="max-w-[120px] text-center text-[10px] leading-snug text-zinc-500">
                    {t(`r${i + 1}.desc`)}
                  </p>
                  <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[9px] font-semibold text-primary-400">
                    {t('badge')}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden">
          <div className="relative ps-10">
            {/* Vertical line */}
            <motion.div
              className="absolute start-[18px] top-0 bottom-0 w-[2px] bg-zinc-800"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              style={{ transformOrigin: 'top' }}
            />

            <div className="space-y-6">
              {ROADMAP.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    className="relative flex items-center gap-4"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                  >
                    {/* Circle on the line */}
                    <div className={`absolute start-[-22px] flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient} shadow-lg ring-4 ring-zinc-950`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{t(`r${i + 1}.title`)}</h3>
                        <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[9px] font-semibold text-primary-400">
                          {t('badge')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{t(`r${i + 1}.desc`)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
