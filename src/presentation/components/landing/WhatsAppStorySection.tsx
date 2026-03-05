'use client';

import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface ChatMessage {
  sender: 'customer' | 'seller' | 'system';
  textKey: string;
  delay: number;
  isLink?: boolean;
}

const MESSAGES: ChatMessage[] = [
  { sender: 'customer', textKey: 'msg1', delay: 0 },
  { sender: 'seller', textKey: 'msg2', delay: 1.5 },
  { sender: 'customer', textKey: 'msg3', delay: 3.5 },
  { sender: 'system', textKey: 'msg4', delay: 5 },
  { sender: 'seller', textKey: 'msg5', delay: 6.5 },
];

export function WhatsAppStorySection() {
  const t = useTranslations('landing.whatsappStory');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    MESSAGES.forEach((msg, i) => {
      // Show typing indicator before message
      setTimeout(() => setShowTyping(true), msg.delay * 1000 - 500);
      // Show message
      setTimeout(() => {
        setShowTyping(false);
        setVisibleMessages(i + 1);
      }, msg.delay * 1000);
    });
  }, [isInView]);

  return (
    <section className="bg-zinc-900/50 px-4 py-20" ref={ref}>
      <div className="mx-auto max-w-md">
        <motion.h2
          className="mb-10 text-center text-3xl font-extrabold text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('title')}
        </motion.h2>

        {/* WhatsApp chat container */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0b141a]">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-zinc-800/50 bg-[#1f2c34] px-4 py-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-400" />
            <div>
              <p className="text-sm font-medium text-white">Fashion Casa</p>
              <p className="text-[10px] text-green-400">online</p>
            </div>
          </div>

          {/* Chat body */}
          <div className="min-h-[340px] space-y-2 p-3">
            {/* Date chip */}
            <div className="flex justify-center pb-2">
              <span className="rounded-lg bg-[#1d2831] px-3 py-1 text-[10px] text-zinc-500">
                Today
              </span>
            </div>

            {MESSAGES.slice(0, visibleMessages).map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.sender === 'customer' ? 'justify-start' : msg.sender === 'system' ? 'justify-center' : 'justify-end'}`}
              >
                {msg.sender === 'system' ? (
                  <div className="rounded-lg bg-[#1d2831] px-3 py-1.5 text-[11px] text-zinc-400">
                    {t(msg.textKey)}
                  </div>
                ) : (
                  <div
                    className={`relative max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                      msg.sender === 'customer'
                        ? 'rounded-tl-sm bg-[#1d2831] text-zinc-200'
                        : 'rounded-tr-sm bg-[#005c4b] text-white'
                    }`}
                  >
                    <p>{t(msg.textKey)}</p>
                    <div className="mt-0.5 flex items-center justify-end gap-1">
                      <span className="text-[9px] text-zinc-500">
                        {`${9}:${String(41 + i).padStart(2, '0')}`}
                      </span>
                      {msg.sender === 'seller' && (
                        <CheckCheck size={12} className="text-blue-400" />
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing indicator */}
            {showTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-end"
              >
                <div className="rounded-xl rounded-tr-sm bg-[#005c4b] px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
