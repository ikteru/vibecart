'use client';

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneMockup({ children, className = '' }: PhoneMockupProps) {
  return (
    <div className={`relative mx-auto w-[280px] ${className}`}>
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border-2 border-zinc-700 bg-zinc-900 p-2 shadow-2xl shadow-primary-500/10">
        {/* Notch */}
        <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
        {/* Screen */}
        <div className="relative overflow-hidden rounded-[2rem] bg-black">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 py-2 text-[10px] text-white/60">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-4 rounded-sm border border-white/40">
                <div className="m-[1px] h-[6px] w-2 rounded-sm bg-green-500" />
              </div>
            </div>
          </div>
          {/* Content */}
          <div className="min-h-[460px]">
            {children}
          </div>
          {/* Home bar */}
          <div className="flex justify-center pb-2 pt-1">
            <div className="h-1 w-28 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
