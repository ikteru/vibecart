import { redirect } from 'next/navigation';
import { getCurrentUser, createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerProfile } from '@/application/use-cases/sellers';
import type { SellerResponseDTO } from '@/application/dtos/SellerDTO';

/**
 * Get current authenticated seller
 *
 * Used by seller dashboard pages to get the authenticated seller's profile.
 * Redirects to login if not authenticated, or to onboarding if no seller profile.
 *
 * @param locale - Current locale for redirects
 * @returns The seller's profile DTO
 */
export async function getCurrentSeller(locale: string): Promise<SellerResponseDTO> {
  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Get seller profile
  const supabase = await createClient();
  const { sellerRepository } = createRepositories(supabase);

  const useCase = new GetSellerProfile(sellerRepository);
  const result = await useCase.execute({ userId: user.id, locale });

  if (!result.seller) {
    // No seller profile - redirect to onboarding
    // TODO: Create onboarding page
    redirect(`/${locale}/auth/login?message=no_seller_profile`);
  }

  return result.seller;
}

/**
 * Check if user is authenticated (without requiring seller profile)
 *
 * Useful for pages that need auth but not necessarily a seller profile.
 *
 * @param locale - Current locale for redirect
 * @returns The authenticated user
 */
export async function requireAuth(locale: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return user;
}
