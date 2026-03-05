'use client';

import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { MessageCircle, ShoppingBag } from 'lucide-react';

const MOCK_ITEMS = [
  { color: 'from-pink-500/20 to-purple-500/20', price: '199' },
  { color: 'from-primary-500/20 to-yellow-500/20', price: '349' },
  { color: 'from-blue-500/20 to-cyan-500/20', price: '129' },
  { color: 'from-green-500/20 to-emerald-500/20', price: '89' },
  { color: 'from-rose-500/20 to-pink-500/20', price: '459' },
  { color: 'from-violet-500/20 to-indigo-500/20', price: '275' },
];

export function InstagramTransformSection() {
  const t = useTranslations('landing.transform');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section className="overflow-hidden px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-zinc-400">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Grid transformation */}
        <div ref={ref} className="relative mx-auto max-w-sm">
          {/* Labels */}
          <div className="mb-4 flex items-center justify-between text-xs font-medium">
            <span className={`transition-all duration-700 ${isInView ? 'text-zinc-600' : 'text-pink-400'}`}>
              {t('before')}
            </span>
            <motion.span
              className="text-primary-400"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.8 }}
            >
              {t('after')}
            </motion.span>
          </div>

          {/* The grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MOCK_ITEMS.map((item, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                {/* Base image placeholder */}
                <div className={`h-full w-full bg-gradient-to-br ${item.color}`} />

                {/* Shop overlay (appears on scroll) */}
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-end bg-black/40 p-2"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                >
                  {/* Price tag */}
                  <motion.span
                    className="mb-1 rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-bold text-white"
                    initial={{ y: 10, opacity: 0 }}
                    animate={isInView ? { y: 0, opacity: 1 } : {}}
                    transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}
                  >
                    {item.price} MAD
                  </motion.span>

                  {/* Order button */}
                  <motion.div
                    className="flex w-full items-center justify-center gap-1 rounded-md bg-green-500 py-1 text-[8px] font-bold text-white"
                    initial={{ y: 10, opacity: 0 }}
                    animate={isInView ? { y: 0, opacity: 1 } : {}}
                    transition={{ delay: 1 + i * 0.1, type: 'spring' }}
                  >
                    <MessageCircle size={8} />
                    {t('order')}
                  </motion.div>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Shop header that appears */}
          <motion.div
            className="absolute -top-2 start-0 end-0 flex items-center gap-2 rounded-xl bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur"
            initial={{ y: -20, opacity: 0 }}
            animate={isInView ? { y: -40, opacity: 1 } : {}}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
              <ShoppingBag size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Fashion Casa</p>
              <p className="text-[10px] text-zinc-500">vibecart.ma/shop/fashion-casa</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
