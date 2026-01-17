import { redirect } from 'next/navigation';
import { getCurrentUser, createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { OnboardingForm } from '@/presentation/components/auth/OnboardingForm';

interface OnboardingPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Seller Onboarding Page
 *
 * Server component that checks auth and renders the onboarding form.
 * Redirects authenticated users with existing seller profiles to dashboard.
 */
export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { locale } = await params;

  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Check if user already has a seller profile
  const supabase = await createClient();
  const { sellerRepository } = createRepositories(supabase);
  const existingSeller = await sellerRepository.findByUserId(user.id);

  if (existingSeller) {
    // Already has seller profile, redirect to dashboard
    redirect(`/${locale}/seller/dashboard`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <OnboardingForm locale={locale} />
    </div>
  );
}
