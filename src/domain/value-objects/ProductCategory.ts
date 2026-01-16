/**
 * ProductCategory Value Object
 *
 * Represents product categories with associated variant presets.
 */

export type ProductCategoryType =
  | 'clothing'
  | 'shoes'
  | 'jewelry'
  | 'beauty'
  | 'home'
  | 'other';

export interface CategoryConfig {
  code: ProductCategoryType;
  labelKey: string; // i18n key
  icon: string;
  variantPresets: string[];
}

/**
 * Category configurations with Moroccan market context
 */
export const CATEGORY_CONFIGS: Record<ProductCategoryType, CategoryConfig> = {
  clothing: {
    code: 'clothing',
    labelKey: 'product.categories.clothing',
    icon: '👕',
    variantPresets: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  shoes: {
    code: 'shoes',
    labelKey: 'product.categories.shoes',
    icon: '👟',
    variantPresets: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  },
  jewelry: {
    code: 'jewelry',
    labelKey: 'product.categories.jewelry',
    icon: '💍',
    variantPresets: ['Gold', 'Silver', 'Rose Gold', 'Bronze'],
  },
  beauty: {
    code: 'beauty',
    labelKey: 'product.categories.beauty',
    icon: '✨',
    variantPresets: ['30ml', '50ml', '100ml', '250ml'],
  },
  home: {
    code: 'home',
    labelKey: 'product.categories.home',
    icon: '🏠',
    variantPresets: ['Small', 'Medium', 'Large', 'Extra Large'],
  },
  other: {
    code: 'other',
    labelKey: 'product.categories.other',
    icon: '📦',
    variantPresets: [],
  },
};

export class ProductCategory {
  private constructor(public readonly value: ProductCategoryType) {
    Object.freeze(this);
  }

  /**
   * Create a ProductCategory from string
   * @throws Error if invalid category
   */
  static create(category: string): ProductCategory {
    const normalized = category.toLowerCase() as ProductCategoryType;

    if (!CATEGORY_CONFIGS[normalized]) {
      throw new Error(`Invalid product category: ${category}`);
    }

    return new ProductCategory(normalized);
  }

  /**
   * Try to create a ProductCategory, returns null if invalid
   */
  static tryCreate(category: string): ProductCategory | null {
    try {
      return ProductCategory.create(category);
    } catch {
      return null;
    }
  }

  /**
   * Check if a string is a valid category
   */
  static isValid(category: string): boolean {
    return category.toLowerCase() in CATEGORY_CONFIGS;
  }

  /**
   * Get all valid categories
   */
  static all(): ProductCategory[] {
    return Object.keys(CATEGORY_CONFIGS).map(
      (code) => new ProductCategory(code as ProductCategoryType)
    );
  }

  /**
   * Get category configuration
   */
  getConfig(): CategoryConfig {
    return CATEGORY_CONFIGS[this.value];
  }

  /**
   * Get i18n label key
   */
  getLabelKey(): string {
    return this.getConfig().labelKey;
  }

  /**
   * Get icon
   */
  getIcon(): string {
    return this.getConfig().icon;
  }

  /**
   * Get variant presets for this category
   */
  getVariantPresets(): string[] {
    return this.getConfig().variantPresets;
  }

  /**
   * Check equality
   */
  equals(other: ProductCategory): boolean {
    return this.value === other.value;
  }

  /**
   * Serialize for JSON/database
   */
  toJSON(): ProductCategoryType {
    return this.value;
  }

  /**
   * Create from JSON/database
   */
  static fromJSON(value: ProductCategoryType): ProductCategory {
    return new ProductCategory(value);
  }

  toString(): string {
    return this.value;
  }
}
