import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';

/**
 * GET /api/shop/[sellerId]/config
 *
 * Public endpoint returning a seller's shop configuration (shipping rates,
 * pickup settings). Used by the public feed to lazy-load checkout config
 * when a customer triggers the buy action.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    const { sellerId } = params;

    if (!sellerId) {
      return NextResponse.json(
        { success: false, error: 'Missing sellerId' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('sellers')
      .select('shop_config')
      .eq('id', sellerId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Extract only checkout-relevant config (shipping + pickup)
    const shopConfig = (data.shop_config as Record<string, unknown>) || {};
    const checkoutConfig = {
      shipping: shopConfig.shipping || undefined,
      pickup: shopConfig.pickup || undefined,
    };

    return NextResponse.json({ success: true, config: checkoutConfig });
  } catch (error) {
    console.error('GET /api/shop/[sellerId]/config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
