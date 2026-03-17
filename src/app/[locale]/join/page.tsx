import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { BetaLanding } from '@/presentation/components/landing/BetaLanding';

interface JoinPageProps {
  params: { locale: string };
}

export default async function JoinPage({ params }: JoinPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect(`/${params.locale}/seller/profile`);
  }

  return (
    <Suspense fallback={null}>
      <BetaLanding />
    </Suspense>
  );
}
