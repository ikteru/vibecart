/**
 * Money Value Object
 *
 * Represents a monetary value with currency.
 * Immutable - all operations return new instances.
 */

export type Currency = 'MAD' | 'USD' | 'EUR' | 'SAR' | 'AED';

/**
 * Currency configuration for supported currencies
 */
export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  nameKey: string; // i18n translation key
  subunitNameKey: string; // i18n translation key for subunit (centimes, cents, etc.)
  subunitRatio: number; // How many subunits in 1 unit (usually 100)
  decimalPlaces: number;
}

/**
 * Currency configurations - used for display and formatting
 * Translation keys reference messages/[locale]/common.json
 */
export const CURRENCY_CONFIG: Record<Currency, CurrencyConfig> = {
  MAD: {
    code: 'MAD',
    symbol: 'د.م.',
    nameKey: 'currency.MAD',
    subunitNameKey: 'currency.centimes',
    subunitRatio: 100,
    decimalPlaces: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    nameKey: 'currency.USD',
    subunitNameKey: 'currency.cents',
    subunitRatio: 100,
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    nameKey: 'currency.EUR',
    subunitNameKey: 'currency.cents',
    subunitRatio: 100,
    decimalPlaces: 2,
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    nameKey: 'currency.SAR',
    subunitNameKey: 'currency.halalas',
    subunitRatio: 100,
    decimalPlaces: 2,
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    nameKey: 'currency.AED',
    subunitNameKey: 'currency.fils',
    subunitRatio: 100,
    decimalPlaces: 2,
  },
};

/**
 * Get currency configuration
 */
export function getCurrencyConfig(currency: Currency): CurrencyConfig {
  return CURRENCY_CONFIG[currency];
}

/**
 * Check if a string is a valid currency code
 */
export function isValidCurrency(code: string): code is Currency {
  return code in CURRENCY_CONFIG;
}

export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: Currency
  ) {
    Object.freeze(this);
  }

  /**
   * Create a new Money instance
   * @throws Error if amount is negative
   */
  static create(amount: number, currency: Currency = 'MAD'): Money {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    // Round to 2 decimal places
    const roundedAmount = Math.round(amount * 100) / 100;
    return new Money(roundedAmount, currency);
  }

  /**
   * Create zero money
   */
  static zero(currency: Currency = 'MAD'): Money {
    return new Money(0, currency);
  }

  /**
   * Create from cents (useful for database storage)
   */
  static fromCents(cents: number, currency: Currency = 'MAD'): Money {
    return Money.create(cents / 100, currency);
  }

  /**
   * Add two money values
   * @throws Error if currencies don't match
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  /**
   * Subtract money value
   * @throws Error if currencies don't match or result would be negative
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Money subtraction would result in negative amount');
    }
    return Money.create(result, this.currency);
  }

  /**
   * Multiply by a factor
   */
  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Cannot multiply money by negative factor');
    }
    return Money.create(this.amount * factor, this.currency);
  }

  /**
   * Check if this money is greater than another
   */
  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  /**
   * Check if this money is less than another
   */
  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  /**
   * Check if equal to another money
   */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  /**
   * Check if zero
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * Get amount in cents (for database storage)
   */
  toCents(): number {
    return Math.round(this.amount * 100);
  }

  /**
   * Format for display
   */
  format(locale: string = 'ar-MA'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(this.amount);
  }

  /**
   * Format without currency symbol (just the number)
   */
  formatAmount(locale: string = 'ar-MA'): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(this.amount);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: ${this.currency} vs ${other.currency}`
      );
    }
  }

  /**
   * Serialize for JSON
   */
  toJSON(): { amount: number; currency: Currency } {
    return { amount: this.amount, currency: this.currency };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: { amount: number; currency: Currency }): Money {
    return Money.create(json.amount, json.currency);
  }
}
