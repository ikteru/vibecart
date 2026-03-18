'use client';

import { useTranslations } from 'next-intl';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';

interface StickyBottomCTAProps {
  onCtaClick: () => void;
}

export function StickyBottomCTA({ onCtaClick }: StickyBottomCTAProps) {
  const t = useTranslations('landing.sticky');
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setShow(latest > window.innerHeight * 0.8);
  });

  if (!show) return null;

  return (
    <motion.div
      className="glass-dark fixed bottom-0 start-0 end-0 z-50 border-t border-zinc-800/50 px-4 py-3 safe-area-inset md:hidden"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        onClick={onCtaClick}
        className="w-full rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25"
        whileTap={{ scale: 0.95 }}
      >
        {t('cta')} →
      </motion.button>
    </motion.div>
  );
}
