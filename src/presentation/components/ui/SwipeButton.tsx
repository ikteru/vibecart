'use client';

import React, { useState, useRef } from 'react';
import { ChevronsRight, Check } from 'lucide-react';

interface SwipeButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
  label: string;
  icon?: React.ReactNode;
  successLabel?: string;
}

/**
 * SwipeButton Component
 *
 * Gesture-based confirmation button with drag-to-confirm interaction.
 * User slides the thumb to 95% to trigger the confirmation callback.
 */
export function SwipeButton({
  onConfirm,
  disabled,
  label,
  icon,
  successLabel = 'Confirmed',
}: SwipeButtonProps) {
  const [dragWidth, setDragWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const handleStart = (clientX: number) => {
    if (disabled || confirmed) return;
    setIsDragging(true);
    startXRef.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled || confirmed || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const thumbWidth = 48;
    const maxDrag = containerWidth - thumbWidth - 8;

    let offset = clientX - startXRef.current;
    offset = Math.max(0, offset);
    offset = Math.min(offset, maxDrag);

    setDragWidth(offset);

    if (offset >= maxDrag * 0.95) {
      setConfirmed(true);
      setIsDragging(false);
      setDragWidth(maxDrag);
      onConfirm();

      // Reset after 3 seconds
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
      setDragWidth(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-14 rounded-full overflow-hidden select-none touch-none transition-all duration-300 ${
        disabled
          ? 'bg-zinc-800 opacity-50 cursor-not-allowed'
          : 'bg-zinc-900 border border-zinc-700 shadow-inner'
      }`}
      onMouseMove={(e) => isDragging && handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => isDragging && handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      {/* Track Label */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isDragging ? 'opacity-30' : 'opacity-100'}`}
      >
        <span
          className={`text-sm font-bold tracking-widest uppercase flex items-center gap-2 ${confirmed ? 'text-emerald-500' : 'text-zinc-500'}`}
        >
          {confirmed ? successLabel : label}{' '}
          {!confirmed && <ChevronsRight size={14} className="animate-pulse" />}
        </span>
      </div>

      {/* Fill Track */}
      <div
        style={{ width: `${dragWidth + 48}px` }}
        className={`absolute inset-y-0 left-0 transition-[width] duration-75 ease-out pointer-events-none ${confirmed ? 'bg-emerald-500' : 'bg-emerald-500/10'}`}
      />

      {/* Thumb */}
      <div
        style={{ transform: `translateX(${dragWidth}px)` }}
        className={`absolute top-1 left-1 bottom-1 w-12 rounded-full flex items-center justify-center shadow-lg border border-white/10 transition-transform duration-75 ease-out z-10
                ${disabled ? 'bg-zinc-600' : confirmed ? 'bg-white' : 'bg-emerald-500 cursor-grab active:cursor-grabbing hover:bg-emerald-400'}
            `}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        {confirmed ? (
          <Check size={20} className="text-emerald-500" />
        ) : (
          <div className="text-white fill-white/20">{icon}</div>
        )}
      </div>
    </div>
  );
}
