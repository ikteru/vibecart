import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { LoginContent } from './LoginContent';

interface LoginPageProps {
  params: { locale: string };
  searchParams: { redirectTo?: string };
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    // Already logged in — send to dashboard (or wherever they were headed)
    redirect(searchParams.redirectTo || `/${params.locale}/seller/dashboard`);
  }

  return <LoginContent />;
}
