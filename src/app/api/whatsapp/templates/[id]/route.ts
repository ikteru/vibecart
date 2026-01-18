import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient, createAdminClient, getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerTemplates, UpdateTemplate, DeleteTemplate } from '@/application/use-cases/whatsapp-templates';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/whatsapp/templates/[id]
 *
 * Get a single template by ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const supabase = await createClient();
    const { sellerRepository, whatsAppTemplateRepository } = createRepositories(supabase);

    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const useCase = new GetSellerTemplates(whatsAppTemplateRepository);
    const result = await useCase.getById({
      templateId: id,
      sellerId: seller.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result.template);
  } catch (error) {
    console.error('GET /api/whatsapp/templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/whatsapp/templates/[id]
 *
 * Update a template.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

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
    const { whatsAppTemplateRepository } = createRepositories(adminClient);

    const useCase = new UpdateTemplate(whatsAppTemplateRepository);
    const result = await useCase.execute({
      templateId: id,
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

    return NextResponse.json(result.template);
  } catch (error) {
    console.error('PUT /api/whatsapp/templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/whatsapp/templates/[id]
 *
 * Delete a template.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    const {
      whatsAppTemplateRepository,
      templateEventBindingRepository,
      whatsAppTokenRepository,
    } = createRepositories(adminClient);

    const useCase = new DeleteTemplate(
      whatsAppTemplateRepository,
      templateEventBindingRepository,
      whatsAppTokenRepository
    );

    const result = await useCase.execute({
      templateId: id,
      sellerId: seller.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/whatsapp/templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
