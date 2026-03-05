'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { PhoneMockup } from './PhoneMockup';
import { Instagram, MessageCircle, ShoppingBag, Check, ChevronDown } from 'lucide-react';

export function HeroSection({ onCtaClick }: { onCtaClick: () => void }) {
  const t = useTranslations('landing');

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Background glow */}
      <div
        className="animate-glow-breathe pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(237,116,32,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-12 lg:flex-row lg:justify-between">
        {/* Text content */}
        <motion.div
          className="max-w-lg space-y-6 text-center lg:text-start"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Brand */}
          <motion.div
            className="flex items-center justify-center gap-3 lg:justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <img src="/logo.svg" alt="VibeCart" className="h-10 w-10" />
            <span className="text-lg font-bold text-white">
              <span dir="ltr">VibeCart</span>
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            {t('hero.title')}
          </h1>

          <p className="text-lg text-zinc-400 sm:text-xl">
            {t('hero.subtitle')}
          </p>

          {/* CTA */}
          <motion.button
            onClick={onCtaClick}
            className="inline-flex items-center gap-3 rounded-2xl bg-primary-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.98]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('hero.cta')}
          </motion.button>

          {/* Quick features */}
          <div className="flex items-center justify-center gap-6 pt-2 lg:justify-start">
            {[
              { icon: Instagram, label: 'Instagram', color: 'text-pink-400' },
              { icon: MessageCircle, label: 'WhatsApp', color: 'text-green-400' },
              { icon: ShoppingBag, label: 'COD', color: 'text-primary-400' },
            ].map((feat) => (
              <div key={feat.label} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <feat.icon size={14} className={feat.color} />
                <span>{feat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Phone mockup */}
        <motion.div
          className="animate-float"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <PhoneMockup>
            <PhoneDemo />
          </PhoneMockup>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 flex flex-col items-center gap-2 text-zinc-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-xs">{t('hero.scrollHint')}</span>
        <ChevronDown size={16} className="animate-bounce" />
      </motion.div>
    </section>
  );
}

function PhoneDemo() {
  return (
    <div className="relative">
      {/* Fake Instagram reel */}
      <div className="relative h-[320px] bg-gradient-to-b from-zinc-800 to-zinc-900">
        {/* Reel content placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-24 w-24 rounded-2xl bg-gradient-to-br from-primary-500/30 to-pink-500/30" />
            <div className="h-2 w-20 mx-auto rounded bg-zinc-700" />
            <div className="mt-1.5 h-2 w-14 mx-auto rounded bg-zinc-800" />
          </div>
        </div>

        {/* Instagram-style reel UI overlay */}
        <div className="absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <span className="text-xs font-semibold text-white">@fashion_casa</span>
          </div>
        </div>
      </div>

      {/* Shop overlay animation sequence */}
      <motion.div
        className="absolute bottom-16 start-4 end-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        {/* Price tag */}
        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1 text-xs font-bold text-white">
          199 MAD
        </div>
      </motion.div>

      {/* WhatsApp order button */}
      <motion.div
        className="absolute bottom-4 start-4 end-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-xs font-bold text-white">
          <MessageCircle size={14} />
          <span>Order via WhatsApp</span>
        </div>
      </motion.div>

      {/* Confirmation checkmark */}
      <motion.div
        className="absolute end-4 top-20"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.5, duration: 0.3, type: 'spring' }}
      >
        <div className="flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-[10px] text-green-400">
          <Check size={10} />
          <span>Ordered</span>
        </div>
      </motion.div>

      {/* Bottom padding */}
      <div className="h-24 bg-black" />
    </div>
  );
}
