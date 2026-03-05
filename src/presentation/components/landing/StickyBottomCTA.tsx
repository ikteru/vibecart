'use client';

import { useTranslations } from 'next-intl';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';

interface StickyBottomCTAProps {
  spotsLeft: number;
  onCtaClick: () => void;
}

export function StickyBottomCTA({ spotsLeft, onCtaClick }: StickyBottomCTAProps) {
  const t = useTranslations('landing.sticky');
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    // Show after scrolling past the hero (roughly one viewport height)
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
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[10px] text-zinc-500">
            {t('spotsLeft', { count: spotsLeft })}
          </p>
        </div>
        <motion.button
          onClick={onCtaClick}
          className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25"
          whileTap={{ scale: 0.95 }}
        >
          {t('cta')}
        </motion.button>
      </div>
    </motion.div>
  );
}
