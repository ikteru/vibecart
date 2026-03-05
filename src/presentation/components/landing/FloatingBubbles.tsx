'use client';

const BUBBLES = [
  { text: 'بغيت هاد المنتج', delay: '0s', duration: '14s', left: '5%' },
  { text: 'شحال الثمن؟', delay: '3s', duration: '11s', left: '75%' },
  { text: 'واش كاين؟', delay: '6s', duration: '13s', left: '40%' },
  { text: 'بغيت 2 من هادو', delay: '9s', duration: '15s', left: '85%' },
  { text: 'وصلني ليوم؟', delay: '12s', duration: '12s', left: '20%' },
  { text: 'شكرا!', delay: '4s', duration: '10s', left: '60%' },
];

export function FloatingBubbles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {BUBBLES.map((bubble, i) => (
        <div
          key={i}
          className="animate-bubble absolute whitespace-nowrap rounded-2xl bg-green-500/5 px-4 py-2 text-xs text-green-500/20 backdrop-blur-sm"
          style={{
            left: bubble.left,
            animationDelay: bubble.delay,
            animationDuration: bubble.duration,
          }}
        >
          {bubble.text}
        </div>
      ))}
    </div>
  );
}
