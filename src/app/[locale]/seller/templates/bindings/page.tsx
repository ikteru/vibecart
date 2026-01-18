import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetEventBindings, GetSellerTemplates } from '@/application/use-cases/whatsapp-templates';
import { EventBindingManager } from '@/presentation/components/seller/templates/EventBindingManager';

interface BindingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Template Event Bindings Page
 *
 * Assign templates to order notification events.
 */
export default async function BindingsPage({ params }: BindingsPageProps) {
  const { locale } = await params;

  // Get authenticated seller
  const seller = await getCurrentSeller(locale);

  // Fetch bindings and approved templates
  const supabase = await createClient();
  const { whatsAppTemplateRepository, templateEventBindingRepository } = createRepositories(supabase);

  const getBindingsUseCase = new GetEventBindings(whatsAppTemplateRepository, templateEventBindingRepository);
  const getTemplatesUseCase = new GetSellerTemplates(whatsAppTemplateRepository);

  const [bindingsResult, templatesResult] = await Promise.all([
    getBindingsUseCase.execute({ sellerId: seller.id }),
    getTemplatesUseCase.execute({ sellerId: seller.id, status: 'APPROVED', limit: 100 }),
  ]);

  return (
    <EventBindingManager
      bindings={bindingsResult.data?.bindings || []}
      availableEvents={bindingsResult.data?.availableEvents || []}
      approvedTemplates={templatesResult.data?.templates || []}
      locale={locale}
    />
  );
}
