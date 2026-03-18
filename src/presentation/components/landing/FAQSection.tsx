'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, DollarSign, Instagram, Smartphone, Banknote, Shield } from 'lucide-react';

const FAQ_ICONS = [DollarSign, Instagram, Smartphone, Banknote, Shield];
const FAQ_COLORS = ['text-emerald-400', 'text-pink-400', 'text-blue-400', 'text-green-400', 'text-yellow-400'];

export function FAQSection() {
  const t = useTranslations('landing.faq');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = Array.from({ length: 5 }, (_, i) => ({
    key: `q${i + 1}`,
    icon: FAQ_ICONS[i],
    color: FAQ_COLORS[i],
    question: t(`q${i + 1}.q`),
    answer: t(`q${i + 1}.a`),
  }));

  return (
    <section className="bg-zinc-900/30 px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <motion.h2
          className="mb-10 text-center text-3xl font-extrabold text-white sm:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('title')}
        </motion.h2>

        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            const Icon = faq.icon;
            return (
              <motion.div
                key={faq.key}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/50"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-start"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800/50 ${faq.color}`}>
                    <Icon size={16} />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-white">{faq.question}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="px-5 pb-4 ps-16 text-sm text-zinc-400">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
