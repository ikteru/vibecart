import { NextResponse } from 'next/server';
import { createClient, createAdminClient, getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { SyncTemplatesFromMeta } from '@/application/use-cases/whatsapp-templates';

/**
 * POST /api/whatsapp/templates/sync
 *
 * Sync template statuses from Meta.
 */
export async function POST() {
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

    const adminClient = createAdminClient();
    const { whatsAppTemplateRepository, whatsAppTokenRepository } = createRepositories(adminClient);

    const useCase = new SyncTemplatesFromMeta(
      whatsAppTemplateRepository,
      whatsAppTokenRepository
    );

    const result = await useCase.execute({
      sellerId: seller.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.result);
  } catch (error) {
    console.error('POST /api/whatsapp/templates/sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
