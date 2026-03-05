'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser, createClient, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { CreateProduct } from '@/application/use-cases/products';
import type { ProductCategoryType } from '@/domain/value-objects/ProductCategory';

interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  promotionLabel?: string;
  stock: number;
  videoUrl?: string;
  instagramMediaId?: string;
  category: ProductCategoryType;
  variants?: string[];
}

/**
 * Create a new product via server action.
 * This bypasses cross-origin cookie issues with ngrok/external domains
 * since it runs server-side with direct cookie access.
 */
export async function createProduct(input: CreateProductInput) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Session expired. Please refresh.' };
  }

  const supabase = await createClient();
  const { sellerRepository } = createRepositories(supabase);

  const seller = await sellerRepository.findByUserId(user.id);
  if (!seller) {
    return { success: false, error: 'Seller profile not found.' };
  }

  const adminClient = createAdminClient();
  const { productRepository } = createRepositories(adminClient);

  try {
    const useCase = new CreateProduct(productRepository);
    const result = await useCase.execute({
      sellerId: seller.id,
      title: input.title,
      description: input.description,
      price: input.price,
      discountPrice: input.discountPrice,
      promotionLabel: input.promotionLabel,
      stock: input.stock,
      videoUrl: input.videoUrl,
      instagramMediaId: input.instagramMediaId,
      category: input.category,
      variants: input.variants,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath('/seller/inventory');
    return { success: true, productId: result.product?.id };
  } catch (error) {
    console.error('createProduct action error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create product' };
  }
}
