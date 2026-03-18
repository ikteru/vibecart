'use client';

import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { PhoneMockup } from './PhoneMockup';
import { ArrowRight } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

export function BeforeAfterSection({ onCtaClick }: { onCtaClick: () => void }) {
  const t = useTranslations('landing.beforeAfter');
  const tSolution = useTranslations('landing.solution');
  const sectionRef = useRef<HTMLDivElement>(null);

  // Track scroll progress through this tall section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Crossfade: Before fades out 0.2→0.5, After fades in 0.5→0.8
  const beforeOpacity = useTransform(scrollYProgress, [0, 0.2, 0.5], [1, 1, 0]);
  const afterOpacity = useTransform(scrollYProgress, [0.4, 0.7, 1], [0, 1, 1]);

  // Labels fade in/out
  const beforeLabelOpacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 1, 0]);
  const afterLabelOpacity = useTransform(scrollYProgress, [0.5, 0.7], [0, 1]);

  // Pills stagger in as scroll progresses
  const pill1Opacity = useTransform(scrollYProgress, [0.15, 0.25], [0, 1]);
  const pill2Opacity = useTransform(scrollYProgress, [0.3, 0.4], [0, 1]);
  const pill3Opacity = useTransform(scrollYProgress, [0.55, 0.65], [0, 1]);
  const pill4Opacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 1]);
  const pillOpacities = [pill1Opacity, pill2Opacity, pill3Opacity, pill4Opacity];

  const pairs = Array.from({ length: 4 }, (_, i) => ({
    pain: t(`pair${i + 1}.pain`),
    fix: t(`pair${i + 1}.fix`),
  }));

  return (
    <section ref={sectionRef} className="relative" style={{ height: '250vh' }}>
      {/* Sticky container — stays centered while user scrolls */}
      <div className="sticky top-0 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        {/* Section title */}
        <motion.h2
          className="mb-10 text-center text-3xl font-extrabold text-white sm:text-4xl"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.05, 0.9, 1], [0, 1, 1, 0]) }}
        >
          {t('title')}
        </motion.h2>

        <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
          {/* Single phone with crossfading content */}
          <div className="relative">
            {/* Before/After labels */}
            <motion.p
              className="mb-3 text-center text-xs font-semibold text-red-400"
              style={{ opacity: beforeLabelOpacity }}
            >
              {t('before')}
            </motion.p>
            <motion.p
              className="absolute -top-1 inset-x-0 text-center text-xs font-semibold text-emerald-400"
              style={{ opacity: afterLabelOpacity }}
            >
              {t('after')}
            </motion.p>

            <PhoneMockup>
              <div className="relative min-h-[340px]">
                {/* Before layer */}
                <motion.div className="absolute inset-0" style={{ opacity: beforeOpacity }}>
                  <BeforePhoneDemo />
                </motion.div>
                {/* After layer */}
                <motion.div className="absolute inset-0" style={{ opacity: afterOpacity }}>
                  <AfterPhoneDemo />
                </motion.div>
              </div>
            </PhoneMockup>

            {/* Tint overlays that crossfade */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-red-500/5"
              style={{ opacity: beforeOpacity }}
            />
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-emerald-500/5"
              style={{ opacity: afterOpacity }}
            />
          </div>

          {/* Pain→fix pills that appear as you scroll */}
          <div className="flex flex-col gap-3 lg:gap-4">
            {pairs.map((pair, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 text-xs sm:text-sm"
                style={{ opacity: pillOpacities[i] }}
              >
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-red-400 border border-red-500/20">
                  {pair.pain}
                </span>
                <ArrowRight size={14} className="shrink-0 text-zinc-600" />
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-400 border border-emerald-500/20">
                  {pair.fix}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA appears at the end */}
        <motion.div
          className="mt-10"
          style={{ opacity: useTransform(scrollYProgress, [0.8, 0.9], [0, 1]) }}
        >
          <motion.button
            onClick={onCtaClick}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tSolution('cta')} →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

/** Simulated DM inbox — chaotic, overflowing */
function BeforePhoneDemo() {
  const messages = [
    { w: 'w-3/4' },
    { w: 'w-2/3' },
    { w: 'w-4/5' },
    { w: 'w-1/2' },
    { w: 'w-3/5' },
    { w: 'w-2/3' },
    { w: 'w-3/4' },
    { w: 'w-1/2' },
  ];

  return (
    <div className="bg-zinc-950 p-3 min-h-[340px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          <div className="h-2 w-16 rounded bg-zinc-700" />
        </div>
        <div className="flex items-center justify-center rounded-full bg-red-500 px-1.5 min-w-[20px] h-5">
          <span className="text-[9px] font-bold text-white">
            <AnimatedCounter target={50} className="" />
          </span>
        </div>
      </div>

      {/* Message rows */}
      <div className="space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-800" />
            <div className="flex-1 space-y-1">
              <div className={`h-2 ${msg.w} rounded bg-zinc-800`} />
              <div className="h-1.5 w-12 rounded bg-zinc-800/50" />
            </div>
            {i < 4 && <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center">
        <span className="text-[10px] text-red-400/60">+42 messages...</span>
      </div>
    </div>
  );
}

/** Clean order dashboard — organized, green checkmarks */
function AfterPhoneDemo() {
  const orders = [
    { status: 'confirmed' },
    { status: 'shipped' },
    { status: 'confirmed' },
    { status: 'delivered' },
  ];

  return (
    <div className="bg-zinc-950 p-3 min-h-[340px]">
      {/* Dashboard header */}
      <div className="mb-3 pb-2 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="h-2 w-20 rounded bg-zinc-700" />
          <div className="h-2 w-8 rounded bg-emerald-500/30" />
        </div>
        {/* Mini chart */}
        <div className="flex items-end gap-[3px] h-8">
          {[3, 5, 4, 7, 6, 8, 5, 9, 7, 10, 8, 12].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-emerald-500/40"
              style={{ height: `${h * 3}px` }}
            />
          ))}
        </div>
      </div>

      {/* Order rows */}
      <div className="space-y-2">
        {orders.map((order, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-zinc-900/50 p-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-2 w-20 rounded bg-zinc-700" />
              <div className="h-1.5 w-14 rounded bg-zinc-800" />
            </div>
            <div className={`rounded-full px-2 py-0.5 text-[8px] font-semibold ${
              order.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
              order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
              'bg-zinc-700 text-zinc-400'
            }`}>
              {order.status === 'confirmed' ? '✓' : order.status === 'shipped' ? '→' : '✓✓'}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg bg-emerald-500/10 p-2 text-center">
        <span className="text-[10px] text-emerald-400/60">+12,400 MAD</span>
      </div>
    </div>
  );
}
