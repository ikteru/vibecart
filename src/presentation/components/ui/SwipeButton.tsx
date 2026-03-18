'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Check } from 'lucide-react';
import { useRTL } from '@/presentation/hooks/useRTL';

interface SwipeButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
  label: string;
  icon?: React.ReactNode;
  successLabel?: string;
  /** When true, the button shows a "blocked" animation (used during scroll transitions) */
  isBlocked?: boolean;
  /** Progress labels shown at drag milestones */
  midLabel?: string;
  nearLabel?: string;
}

export function SwipeButton({
  onConfirm,
  disabled,
  label,
  icon,
  successLabel = 'Confirmed',
  isBlocked = false,
  midLabel,
  nearLabel,
}: SwipeButtonProps) {
  const isRtl = useRTL();
  const [dragWidth, setDragWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const maxDragRef = useRef(0);

  // Compute progress ratio 0-1
  const progress = maxDragRef.current > 0 ? dragWidth / maxDragRef.current : 0;

  // Dynamic fill opacity — intensifies as you drag
  const fillOpacity = confirmed ? 1 : Math.max(0.03, progress * 0.6);

  // Dynamic label based on progress
  const displayLabel = useMemo(() => {
    if (confirmed) return successLabel;
    if (!isDragging || progress < 0.05) return label;
    if (progress >= 0.8 && nearLabel) return nearLabel;
    if (progress >= 0.5 && midLabel) return midLabel;
    return label;
  }, [confirmed, isDragging, progress, label, successLabel, midLabel, nearLabel]);

  const handleStart = (clientX: number) => {
    if (disabled || confirmed || isBlocked) return;
    setIsDragging(true);
    setIsReleasing(false);
    startXRef.current = clientX;

    if (containerRef.current) {
      maxDragRef.current = containerRef.current.offsetWidth - 48 - 8;
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled || confirmed || !containerRef.current) return;

    const maxDrag = maxDragRef.current;
    let offset = isRtl
      ? startXRef.current - clientX
      : clientX - startXRef.current;
    offset = Math.max(0, offset);
    offset = Math.min(offset, maxDrag);

    // Magnetic snap: past 80%, accelerate toward the end
    if (offset > maxDrag * 0.8) {
      const remaining = maxDrag - offset;
      offset = offset + remaining * 0.3;
      offset = Math.min(offset, maxDrag);
    }

    setDragWidth(offset);

    if (offset >= maxDrag * 0.95) {
      setConfirmed(true);
      setIsDragging(false);
      setDragWidth(maxDrag);
      onConfirm();

      setTimeout(() => {
        setConfirmed(false);
        setDragWidth(0);
      }, 3000);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!confirmed) {
      // Elastic snap-back
      setIsReleasing(true);
      setDragWidth(0);
      setTimeout(() => setIsReleasing(false), 400);
    }
  };

  const isIdle = !isDragging && !confirmed && !isReleasing && !isBlocked && !disabled;

  return (
    <div
      ref={containerRef}
      className={`relative h-14 rounded-full overflow-hidden select-none touch-none transition-all duration-300 ${
        disabled
          ? 'bg-zinc-800 opacity-50 cursor-not-allowed'
          : isBlocked
            ? 'bg-zinc-900 border border-zinc-800 opacity-60 animate-blocked-shake'
            : confirmed
              ? 'bg-emerald-500/20 border border-emerald-500/30 animate-confirm-burst'
              : 'bg-zinc-900 border border-zinc-700/50'
      }`}
      onMouseMove={(e) => isDragging && handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => isDragging && handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      {/* Shimmer sweep — only when idle */}
      {isIdle && (
        <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
          <div
            className="absolute inset-0 animate-shimmer-slide"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.06) 40%, rgba(255,255,255,0.04) 50%, rgba(16,185,129,0.06) 60%, transparent 100%)`,
            }}
          />
        </div>
      )}

      {/* Directional chevron arrows — sequential wave, filling entire track */}
      {isIdle && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-around px-1">
          {Array.from({ length: 12 }, (_, i) => (
            <svg
              key={i}
              viewBox="0 0 24 48"
              fill="none"
              className="shrink-0 h-full animate-chevron-flow"
              style={{
                animationDelay: `${i * 0.12}s`,
                width: '24px',
              }}
            >
              <path
                d={isRtl
                  ? 'M24 0L6 24L24 48H14L0 24L14 0H24Z'
                  : 'M0 0L18 24L0 48H10L24 24L10 0H0Z'
                }
                fill="rgba(16,185,129,0.05)"
              />
            </svg>
          ))}
        </div>
      )}

      {/* Destination beacon glow — end of track, pulses */}
      {!confirmed && !disabled && !isBlocked && (
        <div
          className="absolute top-1 bottom-1 end-1 w-12 rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle, rgba(16,185,129,${0.08 + progress * 0.25}) 0%, transparent 70%)`,
            opacity: isDragging ? 1 : 0.6,
          }}
        />
      )}

      {/* Fill track — dynamic opacity */}
      <div
        style={{
          width: `${dragWidth + 48}px`,
          backgroundColor: `rgba(16,185,129,${fillOpacity})`,
        }}
        className={`absolute inset-y-0 start-0 pointer-events-none ${
          isReleasing
            ? 'transition-[width] duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
            : isDragging
              ? 'transition-[width] duration-75 ease-out'
              : ''
        }`}
      />

      {/* Track label */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
          isDragging && progress > 0.1 ? 'opacity-30' : 'opacity-100'
        }`}
      >
        <span
          className={`text-sm font-medium tracking-wide flex items-center gap-1.5 transition-colors duration-200 ${
            confirmed ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          {displayLabel}
        </span>
      </div>

      {/* Thumb */}
      <div
        style={{
          transform: `translateX(${isRtl ? -dragWidth : dragWidth}px)`,
        }}
        className={`absolute top-1 start-1 bottom-1 w-12 rounded-full flex items-center justify-center border border-white/10 z-10
          ${isReleasing
            ? 'transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
            : isDragging
              ? 'transition-transform duration-75 ease-out'
              : ''
          }
          ${disabled
            ? 'bg-zinc-600'
            : isBlocked
              ? 'bg-zinc-600 shadow-none'
              : confirmed
                ? 'bg-white shadow-lg'
                : 'bg-emerald-500 cursor-grab active:cursor-grabbing hover:bg-emerald-400 shadow-lg'
          }
          ${isIdle ? 'animate-thumb-nudge' : ''}
        `}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        {confirmed ? (
          <Check size={20} className="text-emerald-500" />
        ) : (
          <div className={`text-white fill-white/20 ${isRtl ? 'scale-x-[-1]' : ''}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
