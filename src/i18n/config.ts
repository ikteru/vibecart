/**
 * Internationalization Configuration
 *
 * Language Priority:
 * 1. ar-MA - Moroccan Darija (Arabic script) - DEFAULT
 * 2. ar - Classical Arabic
 * 3. fr - French
 * 4. en - English
 */

export const locales = ['ar-MA', 'ar', 'fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar-MA';

export interface LocaleConfig {
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
  flag: string;
}

export const localeConfig: Record<Locale, LocaleConfig> = {
  'ar-MA': {
    name: 'Moroccan Darija',
    nativeName: 'الدارجة المغربية',
    direction: 'rtl',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    flag: '🇲🇦',
  },
  'ar': {
    name: 'Arabic',
    nativeName: 'العربية الفصحى',
    direction: 'rtl',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    flag: '🇸🇦',
  },
  'fr': {
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    flag: '🇫🇷',
  },
  'en': {
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/dd/yyyy',
    numberFormat: {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    flag: '🇬🇧',
  },
};

/**
 * Check if a locale uses RTL direction
 */
export const isRTL = (locale: Locale): boolean =>
  localeConfig[locale].direction === 'rtl';

/**
 * Get locale configuration
 */
export const getLocaleConfig = (locale: Locale): LocaleConfig =>
  localeConfig[locale];

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number, locale: Locale = 'ar-MA'): string => {
  const config = localeConfig[locale];
  return new Intl.NumberFormat(locale, config.numberFormat).format(amount);
};

/**
 * Format date for display
 */
export const formatDate = (date: Date, locale: Locale = 'ar-MA'): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};
