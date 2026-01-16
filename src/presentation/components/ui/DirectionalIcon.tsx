'use client';

import React from 'react';
import { useRTL } from '@/presentation/hooks/useRTL';
import type { LucideIcon } from 'lucide-react';

interface DirectionalIconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  /**
   * Whether to flip the icon horizontally in RTL layouts.
   * Set to false for icons that should NOT flip (logos, non-directional icons).
   * @default true
   */
  flipInRTL?: boolean;
}

/**
 * DirectionalIcon Component
 *
 * Wrapper for icons that should flip direction in RTL layouts.
 * Use for navigation arrows (back, forward, chevrons).
 *
 * Do NOT use for:
 * - Logos and brand icons
 * - Non-directional icons (search, settings, etc.)
 * - Icons that represent physical objects
 *
 * @example
 * ```tsx
 * // Back button that flips in RTL
 * <DirectionalIcon icon={ArrowLeft} size={20} />
 *
 * // Icon that should NOT flip
 * <DirectionalIcon icon={Search} flipInRTL={false} />
 * ```
 */
export function DirectionalIcon({
  icon: Icon,
  size = 20,
  className = '',
  flipInRTL = true,
}: DirectionalIconProps) {
  const isRtl = useRTL();
  const shouldFlip = flipInRTL && isRtl;

  return (
    <Icon
      size={size}
      className={`${className} ${shouldFlip ? 'scale-x-[-1]' : ''}`}
    />
  );
}
