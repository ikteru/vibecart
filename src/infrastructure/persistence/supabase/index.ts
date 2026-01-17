/**
 * Supabase Persistence Layer
 *
 * Factory function for creating repository instances.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseProductRepository } from './SupabaseProductRepository';
import { SupabaseSellerRepository } from './SupabaseSellerRepository';
import { SupabaseOrderRepository } from './SupabaseOrderRepository';

export { SupabaseProductRepository } from './SupabaseProductRepository';
export { SupabaseSellerRepository } from './SupabaseSellerRepository';
export { SupabaseOrderRepository } from './SupabaseOrderRepository';
export type {
  ProductRow,
  SellerRow,
  OrderRow,
  OrderItemRow,
  OrderMessageRow,
  WhatsAppCommandRow,
} from './types';

/**
 * Create all repositories with a single Supabase client
 */
export function createRepositories(supabase: SupabaseClient) {
  return {
    productRepository: new SupabaseProductRepository(supabase),
    sellerRepository: new SupabaseSellerRepository(supabase),
    orderRepository: new SupabaseOrderRepository(supabase),
  };
}
