import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { BetaLanding } from '@/presentation/components/landing/BetaLanding';

interface HomePageProps {
  params: { locale: string };
}

export default async function HomePage({ params }: HomePageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect(`/${params.locale}/seller/dashboard`);
  }

  return (
    <Suspense fallback={null}>
      <BetaLanding />
    </Suspense>
  );
}
