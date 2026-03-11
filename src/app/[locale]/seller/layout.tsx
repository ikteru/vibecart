import { redirect } from 'next/navigation';
import { getCurrentUser, createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerProfile } from '@/application/use-cases/sellers/GetSellerProfile';
import { SellerNav } from '@/presentation/components/seller/SellerNav';

interface SellerLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Seller Dashboard Layout
 *
 * Server component that validates authentication and seller profile.
 * Provides the bottom navigation bar shared across all seller pages.
 */
export default async function SellerLayout({ children, params }: SellerLayoutProps) {
  const { locale } = await params;

  // Get current user
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Check if user has a seller profile
  const supabase = await createClient();
  const { sellerRepository } = createRepositories(supabase);

  const getProfileUseCase = new GetSellerProfile(sellerRepository);
  const result = await getProfileUseCase.execute({
    userId: user.id,
    locale,
  });

  // Redirect to onboarding if no seller profile
  if (!result.seller) {
    redirect(`/${locale}/auth/onboarding`);
  }

  return (
    <div className="h-full bg-zinc-950 text-white">
      <div className="h-full overflow-y-auto no-scrollbar p-6 pb-24">{children}</div>

      {/* Bottom Navigation */}
      <SellerNav locale={locale} shopHandle={result.seller.handle} />
    </div>
  );
}
