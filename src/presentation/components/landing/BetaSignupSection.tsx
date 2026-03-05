'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useEffect, useRef, forwardRef } from 'react';
import { Instagram, Sparkles, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface BetaSignupSectionProps {
  count: number;
  total: number;
  signupSuccess: boolean;
  betaFull: boolean;
}

export const BetaSignupSection = forwardRef<HTMLDivElement, BetaSignupSectionProps>(
  function BetaSignupSection({ count, total, signupSuccess, betaFull }, ref) {
    const t = useTranslations('landing.signup');
    const ts = useTranslations('landing.signup.success');
    const tb = useTranslations('landing.signup.benefits');

    const [isRedirecting, setIsRedirecting] = useState(false);
    const confettiRef = useRef<HTMLDivElement>(null);

    // Haptic feedback on success
    useEffect(() => {
      if (signupSuccess && navigator.vibrate) {
        navigator.vibrate(200);
      }
    }, [signupSuccess]);

    const handleJoinBeta = () => {
      setIsRedirecting(true);
      window.location.href = '/api/auth/instagram/login?from=beta';
    };

    const spotsLeft = total - count;

    return (
      <section ref={ref} className="px-4 py-20" id="signup">
        <div className="mx-auto max-w-2xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-3 text-3xl font-extrabold text-white sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mb-8 text-zinc-400">{t('subtitle')}</p>
          </motion.div>

          {/* Benefits grid */}
          <motion.div
            className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {[
              { key: 'free', icon: '💎' },
              { key: 'support', icon: '💬' },
              { key: 'features', icon: '⚡' },
              { key: 'founding', icon: '👑' },
            ].map((benefit) => (
              <div
                key={benefit.key}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center"
              >
                <span className="text-lg">{benefit.icon}</span>
                <p className="mt-1 text-xs font-bold text-white">{tb(`${benefit.key}`)}</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">{tb(`${benefit.key}Desc`)}</p>
              </div>
            ))}
          </motion.div>

          {/* Spot visualization — 50 dots */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-wrap justify-center gap-1.5">
              {Array.from({ length: total }).map((_, i) => {
                const isFilled = i < count;
                return (
                  <div
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      isFilled
                        ? 'bg-primary-500'
                        : 'animate-pulse-soft bg-zinc-700'
                    }`}
                    style={!isFilled ? { animationDelay: `${(i % 4) * 0.3}s` } : undefined}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-center text-xs text-zinc-500">
              {spotsLeft > 0 ? `${spotsLeft} / ${total}` : ''}
            </p>
          </motion.div>

          {signupSuccess ? (
            /* Success state */
            <motion.div
              className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-green-500/5 p-8 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {/* Confetti particles */}
              <div ref={confettiRef} className="pointer-events-none absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-2 w-2 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      backgroundColor: ['#ed7420', '#22c56e', '#f19044', '#4ade91', '#f59e0b'][i % 5],
                      animation: `confettiPop ${1 + Math.random()}s ease-out ${Math.random() * 0.5}s forwards`,
                    }}
                  />
                ))}
              </div>

              <Sparkles size={48} className="mx-auto mb-4 text-green-400" />
              <h3 className="text-2xl font-extrabold text-white">{ts('title')}</h3>
              <p className="mt-3 text-sm text-zinc-400">{ts('subtitle')}</p>

              <Link
                href="/ar-MA/seller/dashboard"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600"
              >
                {ts('goToDashboard')}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : betaFull ? (
            /* Beta full state */
            <motion.div
              className="rounded-3xl border border-zinc-700 bg-zinc-900/50 p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <AlertCircle size={48} className="mx-auto mb-4 text-zinc-500" />
              <p className="text-sm text-zinc-400">{t('betaFull')}</p>
            </motion.div>
          ) : (
            /* Instagram OAuth button */
            <motion.div
              className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 text-center backdrop-blur sm:p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <motion.button
                onClick={handleJoinBeta}
                disabled={isRedirecting}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 py-4 text-base font-bold text-white shadow-lg shadow-pink-500/25 transition-all hover:shadow-pink-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isRedirecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    {t('connectingInstagram')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Instagram size={20} />
                    {t('instagramCta')}
                  </span>
                )}
              </motion.button>
            </motion.div>
          )}
        </div>
      </section>
    );
  }
);
