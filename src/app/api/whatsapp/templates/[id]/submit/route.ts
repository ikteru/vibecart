import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient, createAdminClient, getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { SubmitTemplateToMeta } from '@/application/use-cases/whatsapp-templates';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/whatsapp/templates/[id]/submit
 *
 * Submit a template to Meta for approval.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const supabase = await createClient();
    const { sellerRepository } = createRepositories(supabase);

    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const adminClient = createAdminClient();
    const { whatsAppTemplateRepository, whatsAppTokenRepository } = createRepositories(adminClient);

    const useCase = new SubmitTemplateToMeta(
      whatsAppTemplateRepository,
      whatsAppTokenRepository
    );

    const result = await useCase.execute({
      templateId: id,
      sellerId: seller.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.result);
  } catch (error) {
    console.error('POST /api/whatsapp/templates/[id]/submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
