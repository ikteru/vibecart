'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { PhoneMockup } from './PhoneMockup';
import { Instagram, ShoppingBag, Users } from 'lucide-react';

interface ShopPreviewSectionProps {
  onSignup: () => void;
}

export function ShopPreviewSection({ onSignup }: ShopPreviewSectionProps) {
  const t = useTranslations('landing.preview');
  const [handle, setHandle] = useState('');

  const cleanHandle = handle.replace(/^@/, '').trim().toLowerCase();
  const displayHandle = cleanHandle || 'your_shop';

  return (
    <section className="bg-zinc-900/50 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          className="mb-10 text-center text-3xl font-extrabold text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('title')}
        </motion.h2>

        <div className="flex flex-col items-center gap-10 lg:flex-row lg:justify-center">
          {/* Input */}
          <motion.div
            className="w-full max-w-sm space-y-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <Instagram size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-pink-400" />
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder={t('placeholder')}
                className="w-full rounded-2xl border border-zinc-700 bg-black py-4 pe-4 ps-12 text-base text-white placeholder-zinc-600 outline-none transition-colors focus:border-primary-500"
                dir="ltr"
              />
            </div>

            {cleanHandle && (
              <motion.button
                onClick={() => onSignup()}
                className="w-full rounded-2xl bg-primary-500 py-4 font-bold text-white transition-colors hover:bg-primary-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t.raw('title') ? '→' : '→'} {t('title')}
              </motion.button>
            )}
          </motion.div>

          {/* Phone preview */}
          <motion.div
            className="animate-float-delayed"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <PhoneMockup>
              <div className="bg-zinc-950 p-4">
                {/* Shop header */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-400">
                    <ShoppingBag size={20} className="text-white" />
                  </div>
                  <div>
                    <motion.p
                      key={displayHandle}
                      className="text-sm font-bold text-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {displayHandle}
                    </motion.p>
                    <p className="text-[10px] text-zinc-500" dir="ltr">
                      {t('shopUrl')}{displayHandle}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-4 flex gap-4">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <ShoppingBag size={10} />
                    <span>12 {t('products')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Users size={10} />
                    <span>2.4k {t('followers')}</span>
                  </div>
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { color: 'from-pink-500/20 to-rose-500/20', price: '199' },
                    { color: 'from-primary-500/20 to-yellow-500/20', price: '349' },
                    { color: 'from-blue-500/20 to-cyan-500/20', price: '129' },
                    { color: 'from-green-500/20 to-emerald-500/20', price: '89' },
                  ].map((item, i) => (
                    <div key={i} className="overflow-hidden rounded-lg">
                      <div className={`aspect-square bg-gradient-to-br ${item.color}`} />
                      <div className="bg-zinc-900 p-1.5">
                        <p className="text-[10px] font-bold text-white">{item.price} MAD</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PhoneMockup>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
