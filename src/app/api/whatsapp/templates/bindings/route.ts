import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient, createAdminClient, getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetEventBindings, AssignTemplateToEvent } from '@/application/use-cases/whatsapp-templates';
import type { NotificationEventType } from '@/domain/entities/TemplateEventBinding';

/**
 * GET /api/whatsapp/templates/bindings
 *
 * Get all event bindings for the authenticated seller.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const {
      sellerRepository,
      whatsAppTemplateRepository,
      templateEventBindingRepository,
    } = createRepositories(supabase);

    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const useCase = new GetEventBindings(
      whatsAppTemplateRepository,
      templateEventBindingRepository
    );

    const result = await useCase.execute({
      sellerId: seller.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('GET /api/whatsapp/templates/bindings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/whatsapp/templates/bindings
 *
 * Assign a template to an event or toggle binding.
 *
 * Body:
 * - eventType: NotificationEventType (required)
 * - templateId: string (required for assignment)
 * - enabled: boolean (optional, for toggling)
 * - remove: boolean (optional, to remove binding)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
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

    const adminClient = createAdminClient();
    const {
      whatsAppTemplateRepository,
      templateEventBindingRepository,
    } = createRepositories(adminClient);

    const useCase = new AssignTemplateToEvent(
      whatsAppTemplateRepository,
      templateEventBindingRepository
    );

    // Handle remove action
    if (body.remove === true) {
      const result = await useCase.remove({
        sellerId: seller.id,
        eventType: body.eventType as NotificationEventType,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle toggle action
    if (body.enabled !== undefined && !body.templateId) {
      const result = await useCase.toggle({
        sellerId: seller.id,
        eventType: body.eventType as NotificationEventType,
        enabled: body.enabled,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    // Handle assignment action
    if (!body.templateId) {
      return NextResponse.json(
        { error: 'templateId is required for assignment' },
        { status: 400 }
      );
    }

    const result = await useCase.execute({
      sellerId: seller.id,
      eventType: body.eventType as NotificationEventType,
      templateId: body.templateId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.binding, { status: 201 });
  } catch (error) {
    console.error('POST /api/whatsapp/templates/bindings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
