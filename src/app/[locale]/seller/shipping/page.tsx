import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { getCurrentUser, createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { UpdateSellerProfile } from '@/application/use-cases/sellers/UpdateSellerProfile';
import { ShippingForm } from '@/presentation/components/seller/ShippingForm';
import type { ShippingConfig } from '@/domain/entities/Seller';

interface ShippingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Seller Shipping Settings Page
 *
 * Server component that fetches seller shipping config.
 */
export default async function ShippingPage({ params }: ShippingPageProps) {
  const { locale } = await params;

  // Get authenticated seller
  const seller = await getCurrentSeller(locale);

  // Server action for updating shipping settings
  async function updateShipping(shipping: ShippingConfig) {
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
      updates: {
        shopConfig: {
          shipping,
        },
      },
      locale,
    });

    return result;
  }

  return (
    <ShippingForm
      locale={locale}
      initialShipping={seller.shopConfig?.shipping}
      updateAction={updateShipping}
    />
  );
}
