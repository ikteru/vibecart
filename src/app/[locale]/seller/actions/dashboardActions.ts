'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser, createClient, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';

/**
 * Update seller's WhatsApp number
 */
export async function updateWhatsAppNumber(whatsappNumber: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Session expired. Please refresh.' };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { sellerRepository } = createRepositories(supabase, adminClient);

  try {
    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return { success: false, error: 'Seller not found' };
    }

    seller.updateProfile({ whatsappNumber });
    await sellerRepository.save(seller);

    revalidatePath('/seller/dashboard');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update WhatsApp number',
    };
  }
}

/**
 * Publish a draft product (set it active with updated fields)
 */
export async function publishDraftProduct(
  productId: string,
  data: { title: string; price: number; category: string }
) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Session expired. Please refresh.' };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { sellerRepository, productRepository } = createRepositories(supabase, adminClient);

  try {
    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return { success: false, error: 'Seller not found' };
    }

    const product = await productRepository.findById(productId);
    if (!product || product.sellerId !== seller.id) {
      return { success: false, error: 'Product not found' };
    }

    // Update fields
    product.updateDetails({ title: data.title, category: data.category as import('@/domain/value-objects/ProductCategory').ProductCategoryType });
    product.updatePricing({ price: data.price });
    product.activate();

    await productRepository.save(product);

    revalidatePath('/seller/dashboard');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish product',
    };
  }
}

/**
 * Publish all draft products for the current seller
 */
export async function publishAllDrafts() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, count: 0, error: 'Session expired. Please refresh.' };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { sellerRepository, productRepository } = createRepositories(supabase, adminClient);

  try {
    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return { success: false, count: 0, error: 'Seller not found' };
    }

    const drafts = await productRepository.findBySellerId(seller.id, { isActive: false });
    let count = 0;

    for (const product of drafts) {
      if (product.price.amount > 0) {
        product.activate();
        await productRepository.save(product);
        count++;
      }
    }

    revalidatePath('/seller/dashboard');
    return { success: true, count };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to publish drafts',
    };
  }
}
