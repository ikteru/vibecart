'use client';

const CARDS = [
  { left: '5%', duration: '18s', delay: '0s', opacity: 0.06, gradient: 'from-pink-500/30 to-purple-500/30', rotate: '3deg', size: 'w-14 h-18' },
  { left: '15%', duration: '14s', delay: '-4s', opacity: 0.04, gradient: 'from-orange-500/30 to-red-500/30', rotate: '-5deg', size: 'w-12 h-16' },
  { left: '28%', duration: '20s', delay: '-8s', opacity: 0.05, gradient: 'from-purple-500/30 to-blue-500/30', rotate: '2deg', size: 'w-16 h-20' },
  { left: '38%', duration: '12s', delay: '-2s', opacity: 0.07, gradient: 'from-yellow-500/30 to-pink-500/30', rotate: '-3deg', size: 'w-10 h-14' },
  { left: '52%', duration: '16s', delay: '-6s', opacity: 0.04, gradient: 'from-pink-500/30 to-orange-500/30', rotate: '4deg', size: 'w-14 h-18' },
  { left: '62%', duration: '22s', delay: '-10s', opacity: 0.06, gradient: 'from-blue-500/30 to-purple-500/30', rotate: '-2deg', size: 'w-12 h-16' },
  { left: '72%', duration: '13s', delay: '-3s', opacity: 0.05, gradient: 'from-red-500/30 to-pink-500/30', rotate: '5deg', size: 'w-16 h-20' },
  { left: '82%', duration: '19s', delay: '-7s', opacity: 0.04, gradient: 'from-purple-500/30 to-pink-500/30', rotate: '-4deg', size: 'w-10 h-14' },
  { left: '90%', duration: '15s', delay: '-1s', opacity: 0.06, gradient: 'from-orange-500/30 to-yellow-500/30', rotate: '2deg', size: 'w-14 h-18' },
  { left: '10%', duration: '17s', delay: '-9s', opacity: 0.03, gradient: 'from-pink-500/30 to-red-500/30', rotate: '-6deg', size: 'w-12 h-16' },
  { left: '45%', duration: '21s', delay: '-5s', opacity: 0.05, gradient: 'from-violet-500/30 to-blue-500/30', rotate: '3deg', size: 'w-10 h-14' },
  { left: '75%', duration: '11s', delay: '-11s', opacity: 0.04, gradient: 'from-pink-500/30 to-purple-500/30', rotate: '-1deg', size: 'w-16 h-20' },
];

export function ParallaxCards() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
      {CARDS.map((card, i) => (
        <div
          key={i}
          className={`animate-card-rain absolute rounded-lg bg-gradient-to-br ${card.gradient} ${card.size}`}
          style={{
            left: card.left,
            animationDuration: card.duration,
            animationDelay: card.delay,
            opacity: card.opacity,
            transform: `rotate(${card.rotate})`,
          }}
        />
      ))}
    </div>
  );
}
