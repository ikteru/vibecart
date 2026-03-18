import { redirect } from 'next/navigation';
import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { getCurrentUser, createClient, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { UpdateSellerProfile } from '@/application/use-cases/sellers/UpdateSellerProfile';
import { SettingsForm } from '@/presentation/components/seller/SettingsForm';
import { SettingsMenu } from '@/presentation/components/seller/SettingsMenu';
import type { UpdateSellerDTO } from '@/application/dtos/SellerDTO';

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    section?: string;
  }>;
}

/**
 * Seller Settings Page
 *
 * Shows grouped settings menu by default.
 * When a section query param is present, shows the full SettingsForm
 * scrolled to that section for detailed editing.
 */
export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const { locale } = await params;
  const { section } = await searchParams;

  const seller = await getCurrentSeller(locale);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Server action for updating seller profile
  async function updateSettings(data: UpdateSellerDTO) {
    'use server';

    const supabaseServer = await createClient();
    const adminClient = createAdminClient();
    const repos = createRepositories(supabaseServer, adminClient);
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

  // If a section is specified, show the full settings form
  if (section) {
    return (
      <SettingsForm
        seller={seller}
        locale={locale}
        updateAction={updateSettings}
        logoutAction={logout}
      />
    );
  }

  // Default: show the grouped settings menu
  return (
    <SettingsMenu
      seller={seller}
      locale={locale}
      logoutAction={logout}
    />
  );
}
