'use client';

import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';

const NOTIFICATIONS = [
  { handle: 'beauty_nour', text: 'بغيت هاد المنتج', top: '12%', side: 'start', delay: 0, gradient: 'from-purple-600 via-pink-500 to-orange-400' },
  { handle: 'sara_mode', text: 'شحال الثمن؟', top: '35%', side: 'end', delay: 4, gradient: 'from-yellow-400 via-pink-500 to-purple-600' },
  { handle: 'amina.shop', text: 'واش كاين؟', top: '58%', side: 'start', delay: 8, gradient: 'from-pink-500 via-red-500 to-orange-400' },
  { handle: 'fashion_rania', text: 'بغيت 2 من هادو', top: '22%', side: 'end', delay: 12, gradient: 'from-purple-500 via-pink-500 to-red-500' },
  { handle: 'kenza_style', text: 'وصلني ليوم؟', top: '48%', side: 'start', delay: 16, gradient: 'from-orange-400 via-pink-500 to-purple-600' },
  { handle: 'client_casa', text: 'شكرا!', top: '72%', side: 'end', delay: 20, gradient: 'from-pink-400 via-purple-500 to-blue-500' },
] as const;

const CYCLE_DURATION = 24;

export function FloatingBubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-[100]" aria-hidden="true">
      {NOTIFICATIONS.map((notif, i) => (
        <DmBubble key={i} notif={notif} />
      ))}
    </div>
  );
}

function DmBubble({ notif }: { notif: typeof NOTIFICATIONS[number] }) {
  const isStart = notif.side === 'start';
  const xHidden = isStart ? -320 : 320;

  return (
    <motion.div
      className={`absolute ${isStart ? 'start-4' : 'end-4'}`}
      style={{ top: notif.top }}
      initial={{ x: xHidden, opacity: 0 }}
      animate={{
        x: [xHidden, 0, 0, xHidden],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 4,
        delay: notif.delay,
        repeat: Infinity,
        repeatDelay: CYCLE_DURATION - 4,
        times: [0, 0.15, 0.85, 1],
        ease: 'easeInOut',
      }}
    >
      {/* Instagram DM notification style */}
      <div className="flex items-center gap-2.5 rounded-full bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 ps-1 pe-4 py-1 shadow-2xl shadow-black/40">
        {/* Avatar with Instagram gradient ring */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${notif.gradient} p-[2px]`}>
          <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-900">
            <Instagram size={14} className="text-white/80" />
          </div>
        </div>

        {/* DM content */}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-white leading-none" dir="ltr">{notif.handle}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[140px]">{notif.text}</p>
        </div>
      </div>
    </motion.div>
  );
}
