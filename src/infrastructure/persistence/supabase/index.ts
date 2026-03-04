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
import { SupabaseWhatsAppTemplateRepository } from './SupabaseWhatsAppTemplateRepository';
import { SupabaseTemplateEventBindingRepository } from './SupabaseTemplateEventBindingRepository';
import { SupabaseDeliveryPersonRepository } from './SupabaseDeliveryPersonRepository';
import { SupabaseOrderDispatchRepository } from './SupabaseOrderDispatchRepository';

export { SupabaseProductRepository } from './SupabaseProductRepository';
export { SupabaseSellerRepository } from './SupabaseSellerRepository';
export { SupabaseOrderRepository } from './SupabaseOrderRepository';
export { SupabaseActivityLogRepository } from './SupabaseActivityLogRepository';
export { SupabaseInstagramTokenRepository } from './SupabaseInstagramTokenRepository';
export { SupabaseWhatsAppTokenRepository } from './SupabaseWhatsAppTokenRepository';
export { SupabaseWhatsAppMessageRepository } from './SupabaseWhatsAppMessageRepository';
export { SupabaseWhatsAppTemplateRepository } from './SupabaseWhatsAppTemplateRepository';
export { SupabaseTemplateEventBindingRepository } from './SupabaseTemplateEventBindingRepository';
export { SupabaseDeliveryPersonRepository } from './SupabaseDeliveryPersonRepository';
export { SupabaseOrderDispatchRepository } from './SupabaseOrderDispatchRepository';
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
  TemplateEventBindingRow,
  DeliveryPersonRow,
  OrderDispatchRow,
} from './types';

/**
 * Create all repositories with a single Supabase client
 */
export function createRepositories(supabase: SupabaseClient, adminClient?: SupabaseClient) {
  return {
    productRepository: new SupabaseProductRepository(supabase),
    sellerRepository: new SupabaseSellerRepository(supabase, adminClient),
    orderRepository: new SupabaseOrderRepository(supabase),
    activityLogRepository: new SupabaseActivityLogRepository(supabase),
    instagramTokenRepository: new SupabaseInstagramTokenRepository(supabase),
    whatsAppTokenRepository: new SupabaseWhatsAppTokenRepository(supabase),
    whatsAppMessageRepository: new SupabaseWhatsAppMessageRepository(supabase),
    whatsAppTemplateRepository: new SupabaseWhatsAppTemplateRepository(supabase),
    templateEventBindingRepository: new SupabaseTemplateEventBindingRepository(supabase),
    deliveryPersonRepository: new SupabaseDeliveryPersonRepository(supabase, adminClient),
    orderDispatchRepository: new SupabaseOrderDispatchRepository(supabase, adminClient),
  };
}
