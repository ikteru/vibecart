import { redirect } from 'next/navigation';
import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { getCurrentUser, createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { UpdateSellerProfile } from '@/application/use-cases/sellers/UpdateSellerProfile';
import { SettingsForm } from '@/presentation/components/seller/SettingsForm';
import type { UpdateSellerDTO } from '@/application/dtos/SellerDTO';

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Seller Settings Page
 *
 * Server component that fetches seller data and passes to client form.
 */
export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;

  // Get authenticated seller
  const seller = await getCurrentSeller(locale);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Server action for updating seller profile
  async function updateSettings(data: UpdateSellerDTO) {
    'use server';

    const supabaseServer = await createClient();
    const repos = createRepositories(supabaseServer);
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const updateUseCase = new UpdateSellerProfile(repos.sellerRepository);
    const result = await updateUseCase.execute({
      userId: currentUser.id,
      updates: data,
      locale,
    });

    return result;
  }

  // Server action for logout
  async function logout() {
    'use server';

    const supabaseServer = await createClient();
    await supabaseServer.auth.signOut();
  }

  return (
    <SettingsForm
      seller={seller}
      locale={locale}
      updateAction={updateSettings}
      logoutAction={logout}
    />
  );
}
