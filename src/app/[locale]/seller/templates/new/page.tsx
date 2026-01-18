import { getCurrentSeller } from '@/lib/auth/getCurrentSeller';
import { TemplateBuilder } from '@/presentation/components/seller/templates/TemplateBuilder';

interface NewTemplatePageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * New Template Page
 *
 * Template creation wizard with visual composer.
 */
export default async function NewTemplatePage({ params }: NewTemplatePageProps) {
  const { locale } = await params;

  // Get authenticated seller (validates access)
  await getCurrentSeller(locale);

  return <TemplateBuilder locale={locale} mode="create" />;
}
