import { revalidatePath } from 'next/cache';
import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { getCurrentUser, createClient, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { SupabaseSellerRepository } from '@/infrastructure/persistence/supabase';
import { UpdateSellerProfile } from '@/application/use-cases/sellers/UpdateSellerProfile';
import { VibeForm } from '@/presentation/components/seller/VibeForm';
import type { UpdateSellerDTO } from '@/application/dtos/SellerDTO';

interface EditProfilePageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Edit Profile Page
 *
 * Merges the vibe settings into a profile editing experience.
 * Uses the existing VibeForm component which already handles
 * maker bio, spotlight, pinned reviews, and chat screenshots.
 */
export default async function EditProfilePage({ params }: EditProfilePageProps) {
  const { locale } = await params;

  const seller = await getCurrentSeller(locale);

  async function updateProfile(data: UpdateSellerDTO) {
    'use server';

    const supabaseServer = await createClient();
    const adminClient = createAdminClient();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const sellerRepository = new SupabaseSellerRepository(supabaseServer, adminClient);
    const updateUseCase = new UpdateSellerProfile(sellerRepository);
    const result = await updateUseCase.execute({
      userId: currentUser.id,
      updates: data,
      locale,
    });

    if (result.success && result.seller) {
      revalidatePath(`/${locale}/shop/${result.seller.handle}`);
      revalidatePath(`/${locale}/seller/profile`);
      revalidatePath(`/${locale}/seller/profile/edit`);
    }

    return result;
  }

  return <VibeForm seller={seller} updateAction={updateProfile} />;
}
