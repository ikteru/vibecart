import { getCurrentUser, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { SupabaseFeedRepository } from '@/infrastructure/persistence/supabase/SupabaseFeedRepository';
import { GetPublicFeed } from '@/application/use-cases/feed/GetPublicFeed';
import { PublicVideoFeed } from '@/presentation/components/feed/PublicVideoFeed';

interface HomePageProps {
  params: { locale: string };
}

export default async function HomePage({ params }: HomePageProps) {
  const user = await getCurrentUser();

  // Fetch initial feed data server-side
  const adminClient = createAdminClient();
  const feedRepository = new SupabaseFeedRepository(adminClient);
  const useCase = new GetPublicFeed(feedRepository);
  const result = await useCase.execute({ limit: 10 });

  return (
    <PublicVideoFeed
      initialProducts={result.products}
      initialCursor={result.nextCursor}
      isLoggedInSeller={!!user}
    />
  );
}
