import { redirect } from 'next/navigation';
import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerTemplates } from '@/application/use-cases/whatsapp-templates';
import { TemplateBuilder } from '@/presentation/components/seller/templates/TemplateBuilder';

interface EditTemplatePageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

/**
 * Edit Template Page
 *
 * Edit an existing template (only if DRAFT or REJECTED).
 */
export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { locale, id } = await params;

  // Get authenticated seller
  const seller = await getCurrentSeller(locale);

  // Fetch template
  const supabase = await createClient();
  const { whatsAppTemplateRepository } = createRepositories(supabase);

  const useCase = new GetSellerTemplates(whatsAppTemplateRepository);
  const result = await useCase.getById({
    templateId: id,
    sellerId: seller.id,
  });

  if (!result.success || !result.template) {
    redirect(`/${locale}/seller/templates`);
  }

  return (
    <TemplateBuilder
      locale={locale}
      mode="edit"
      template={result.template}
    />
  );
}
