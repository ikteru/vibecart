'use client';

import { useParams } from 'next/navigation';
import { isRTL, type Locale } from '@/i18n/config';

/**
 * Hook to determine if the current locale is RTL (Right-to-Left)
 *
 * @returns boolean - true if the current locale is RTL (ar, ar-MA)
 *
 * @example
 * ```tsx
 * function Component() {
 *   const isRtl = useRTL();
 *   return <div className={isRtl ? 'text-end' : 'text-start'}>Hello</div>;
 * }
 * ```
 */
export function useRTL(): boolean {
  const params = useParams();
  const locale = params.locale as Locale;
  return isRTL(locale);
}
