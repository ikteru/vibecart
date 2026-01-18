import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerTemplates } from '@/application/use-cases/whatsapp-templates';
import { TemplateList } from '@/presentation/components/seller/templates/TemplateList';

interface TemplatesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Seller Templates Page
 *
 * Displays WhatsApp message templates with status badges.
 * Allows creating, editing, and managing templates.
 */
export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const { locale } = await params;

  // Get authenticated seller
  const seller = await getCurrentSeller(locale);

  // Fetch templates from database
  const supabase = await createClient();
  const { whatsAppTemplateRepository } = createRepositories(supabase);

  const getTemplatesUseCase = new GetSellerTemplates(whatsAppTemplateRepository);
  const [templatesResult, statsResult] = await Promise.all([
    getTemplatesUseCase.execute({ sellerId: seller.id, limit: 50 }),
    getTemplatesUseCase.getStats({ sellerId: seller.id }),
  ]);

  return (
    <TemplateList
      initialTemplates={templatesResult.data?.templates || []}
      stats={statsResult.stats}
      locale={locale}
    />
  );
}
