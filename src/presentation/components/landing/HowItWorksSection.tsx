'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Instagram, Link2, MessageCircle } from 'lucide-react';

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.25 },
  },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] as const } },
};

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');

  const steps = [
    {
      icon: Instagram,
      gradient: 'from-purple-500 to-pink-500',
      ring: 'ring-purple-500/20',
      title: t('step1.title'),
      desc: t('step1.desc'),
    },
    {
      icon: Link2,
      gradient: 'from-primary-500 to-primary-400',
      ring: 'ring-primary-500/20',
      title: t('step2.title'),
      desc: t('step2.desc'),
    },
    {
      icon: MessageCircle,
      gradient: 'from-green-500 to-green-400',
      ring: 'ring-green-500/20',
      title: t('step3.title'),
      desc: t('step3.desc'),
    },
  ];

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          className="mb-16 text-center text-3xl font-extrabold text-white sm:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('title')}
        </motion.h2>

        <motion.div
          className="grid gap-8 md:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={item}
              className="group relative flex flex-col items-center text-center"
            >
              {/* Step number */}
              <span className="absolute -top-3 text-6xl font-black text-zinc-800/50">
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Icon */}
              <div className={`relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${step.gradient} ring-4 ${step.ring} shadow-lg transition-transform group-hover:scale-110`}>
                <step.icon size={32} className="text-white" />
              </div>

              {/* Connector line (between steps) */}
              {i < 2 && (
                <div className="absolute start-[60%] top-10 hidden h-[2px] w-[calc(100%-20%)] bg-gradient-to-r from-zinc-700 to-transparent md:block" />
              )}

              <h3 className="mb-2 text-xl font-bold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
