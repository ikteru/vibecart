import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { DisconnectWhatsApp } from '@/application/use-cases/whatsapp-business';

/**
 * POST /api/auth/whatsapp/disconnect
 *
 * Disconnects WhatsApp Business from seller account.
 * Removes stored token and updates seller config.
 */
export async function POST() {
  try {
    // 1. Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get seller ID
    const { sellerRepository: readerRepo } = createRepositories(supabase);
    const seller = await readerRepo.findByUserId(user.id);

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    // 3. Use admin client for write operations
    const adminClient = createAdminClient();
    const { whatsAppTokenRepository, sellerRepository } = createRepositories(adminClient);

    // 4. Execute disconnect
    const useCase = new DisconnectWhatsApp(whatsAppTokenRepository, sellerRepository);
    const result = await useCase.execute({
      sellerId: seller.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to disconnect' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WhatsApp disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect WhatsApp Business' },
      { status: 500 }
    );
  }
}
