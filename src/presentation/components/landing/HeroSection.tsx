'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { PhoneMockup } from './PhoneMockup';
import { MessageCircle, ChevronDown } from 'lucide-react';

export function HeroSection({ onCtaClick }: { onCtaClick: () => void }) {
  const t = useTranslations('landing');

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(237,116,32,0.08) 0%, transparent 70%)',
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
          {/* Logo */}
          <motion.div
            className="flex items-center justify-center gap-3 lg:justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <img src="/logo.svg" alt="VibeCart" className="h-8 w-8" />
            <span className="text-sm font-bold text-white" dir="ltr">VibeCart</span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
            {t('hero.title')}
          </h1>

          {/* Typing simulator subtitle */}
          <div className="h-8 sm:h-9">
            <TypingSubtitle
              lines={[t('hero.typing1'), t('hero.typing2'), t('hero.typing3')]}
            />
          </div>
          {/* Accessible fallback */}
          <p className="sr-only">{t('hero.subtitle')}</p>

          {/* CTA */}
          <motion.button
            onClick={onCtaClick}
            className="inline-flex items-center gap-3 rounded-2xl bg-primary-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.98]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('hero.cta')} →
          </motion.button>

          {/* Social proof */}
          <p className="text-xs text-zinc-500">
            {t('hero.socialProof')}
          </p>
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
        <ChevronDown size={16} className="animate-bounce" />
      </motion.div>
    </section>
  );
}

function TypingSubtitle({ lines }: { lines: string[] }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLine = lines[lineIndex] || '';
  const displayText = currentLine.slice(0, charIndex);

  const tick = useCallback(() => {
    if (!isDeleting) {
      // Typing forward
      if (charIndex < currentLine.length) {
        timeoutRef.current = setTimeout(() => setCharIndex((c) => c + 1), 50 + Math.random() * 30);
      } else {
        // Finished typing — pause then start deleting
        timeoutRef.current = setTimeout(() => setIsDeleting(true), 2000);
      }
    } else {
      // Deleting backward
      if (charIndex > 0) {
        timeoutRef.current = setTimeout(() => setCharIndex((c) => c - 1), 25);
      } else {
        // Finished deleting — move to next line
        setIsDeleting(false);
        setLineIndex((i) => (i + 1) % lines.length);
      }
    }
  }, [charIndex, isDeleting, currentLine, lines.length]);

  useEffect(() => {
    tick();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick]);

  // Respect reduced motion
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return <p className="text-base text-zinc-400 sm:text-lg">{lines[0]}</p>;
  }

  return (
    <p className="text-base text-zinc-400 sm:text-lg">
      {displayText}
      <span className="animate-pulse text-primary-400">|</span>
    </p>
  );
}

function PhoneDemo() {
  return (
    <div className="relative">
      {/* Fake Instagram reel — buyer experience */}
      <div className="relative h-[360px] bg-gradient-to-b from-zinc-800 to-zinc-900">
        {/* Reel content placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-28 w-28 rounded-2xl bg-gradient-to-br from-pink-500/20 to-primary-500/20" />
            <div className="mx-auto h-2 w-20 rounded bg-zinc-700" />
            <div className="mx-auto mt-1.5 h-2 w-14 rounded bg-zinc-800" />
          </div>
        </div>

        {/* Instagram-style overlay */}
        <div className="absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <span className="text-xs font-semibold text-white" dir="ltr">@fashion_casa</span>
          </div>
          <p className="text-[10px] text-white/60 line-clamp-1">Robe Caftan — Collection Été 2026</p>
        </div>

        {/* Floating product tag */}
        <motion.div
          className="absolute bottom-20 start-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            199 MAD
          </div>
        </motion.div>
      </div>

      {/* Swipe-to-order button */}
      <motion.div
        className="px-3 py-3 bg-black"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <div className="relative flex items-center rounded-full bg-emerald-500 py-2.5 overflow-hidden">
          <div className="absolute start-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
            <MessageCircle size={12} className="text-white" />
          </div>
          <span className="mx-auto text-xs font-bold text-white">199 MAD · Glisser pour acheter</span>
        </div>
      </motion.div>

      {/* Confirmation animation */}
      <motion.div
        className="absolute end-4 top-16"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.5, duration: 0.3, type: 'spring' }}
      >
        <div className="flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-[10px] text-green-400">
          ✓ Commandé
        </div>
      </motion.div>

      {/* Bottom padding */}
      <div className="h-8 bg-black" />
    </div>
  );
}
