import { revalidatePath } from 'next/cache';
import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { getCurrentUser, createClient, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { SupabaseSellerRepository } from '@/infrastructure/persistence/supabase';
import { UpdateSellerProfile } from '@/application/use-cases/sellers/UpdateSellerProfile';
import { VibeForm } from '@/presentation/components/seller/VibeForm';
import type { UpdateSellerDTO } from '@/application/dtos/SellerDTO';

interface VibePageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Seller Shop Vibe Page
 *
 * Server component that fetches seller data for vibe customization.
 */
export default async function VibePage({ params }: VibePageProps) {
  const { locale } = await params;

  // Get authenticated seller
  const seller = await getCurrentSeller(locale);

  // Server action for updating vibe settings
  async function updateVibe(data: UpdateSellerDTO) {
    'use server';

    const supabaseServer = await createClient();
    const adminClient = createAdminClient();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use admin client for writes (RLS verified in application layer)
    const sellerRepository = new SupabaseSellerRepository(supabaseServer, adminClient);
    const updateUseCase = new UpdateSellerProfile(sellerRepository);
    const result = await updateUseCase.execute({
      userId: currentUser.id,
      updates: data,
      locale,
    });

    // Revalidate the shop page to show updated vibe settings
    if (result.success && result.seller) {
      revalidatePath(`/${locale}/shop/${result.seller.handle}`);
      revalidatePath(`/${locale}/seller/vibe`);
    }

    return result;
  }

  return <VibeForm seller={seller} updateAction={updateVibe} />;
}
