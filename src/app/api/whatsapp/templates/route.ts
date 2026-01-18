import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient, createAdminClient, getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerTemplates, CreateTemplate } from '@/application/use-cases/whatsapp-templates';
import type { TemplateStatus } from '@/domain/entities/WhatsAppMessageTemplate';

/**
 * GET /api/whatsapp/templates
 *
 * List templates for the authenticated seller.
 * Query params: status, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { sellerRepository, whatsAppTemplateRepository } = createRepositories(supabase);

    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const useCase = new GetSellerTemplates(whatsAppTemplateRepository);

    const result = await useCase.execute({
      sellerId: seller.id,
      status: searchParams.get('status') as TemplateStatus | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('GET /api/whatsapp/templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/whatsapp/templates
 *
 * Create a new template.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { sellerRepository } = createRepositories(supabase);

    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    const adminClient = createAdminClient();
    const { whatsAppTemplateRepository } = createRepositories(adminClient);

    const useCase = new CreateTemplate(whatsAppTemplateRepository);
    const result = await useCase.execute({
      sellerId: seller.id,
      templateName: body.templateName,
      templateLanguage: body.templateLanguage,
      category: body.category,
      description: body.description,
      components: body.components,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.template, { status: 201 });
  } catch (error) {
    console.error('POST /api/whatsapp/templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
