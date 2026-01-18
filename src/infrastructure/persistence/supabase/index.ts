/**
 * Supabase Persistence Layer
 *
 * Factory function for creating repository instances.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseProductRepository } from './SupabaseProductRepository';
import { SupabaseSellerRepository } from './SupabaseSellerRepository';
import { SupabaseOrderRepository } from './SupabaseOrderRepository';
import { SupabaseActivityLogRepository } from './SupabaseActivityLogRepository';
import { SupabaseInstagramTokenRepository } from './SupabaseInstagramTokenRepository';
import { SupabaseWhatsAppTokenRepository } from './SupabaseWhatsAppTokenRepository';
import { SupabaseWhatsAppMessageRepository } from './SupabaseWhatsAppMessageRepository';

export { SupabaseProductRepository } from './SupabaseProductRepository';
export { SupabaseSellerRepository } from './SupabaseSellerRepository';
export { SupabaseOrderRepository } from './SupabaseOrderRepository';
export { SupabaseActivityLogRepository } from './SupabaseActivityLogRepository';
export { SupabaseInstagramTokenRepository } from './SupabaseInstagramTokenRepository';
export { SupabaseWhatsAppTokenRepository } from './SupabaseWhatsAppTokenRepository';
export { SupabaseWhatsAppMessageRepository } from './SupabaseWhatsAppMessageRepository';
export type {
  ProductRow,
  SellerRow,
  OrderRow,
  OrderItemRow,
  OrderMessageRow,
  WhatsAppCommandRow,
  ActivityLogRow,
  InstagramTokenRow,
  WhatsAppBusinessTokenRow,
  WhatsAppMessageTemplateRow,
  WhatsAppMessageRow,
} from './types';

/**
 * Create all repositories with a single Supabase client
 */
export function createRepositories(supabase: SupabaseClient) {
  return {
    productRepository: new SupabaseProductRepository(supabase),
    sellerRepository: new SupabaseSellerRepository(supabase),
    orderRepository: new SupabaseOrderRepository(supabase),
    activityLogRepository: new SupabaseActivityLogRepository(supabase),
    instagramTokenRepository: new SupabaseInstagramTokenRepository(supabase),
    whatsAppTokenRepository: new SupabaseWhatsAppTokenRepository(supabase),
    whatsAppMessageRepository: new SupabaseWhatsAppMessageRepository(supabase),
  };
}
