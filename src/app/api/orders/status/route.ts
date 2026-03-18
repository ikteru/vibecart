import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';

/**
 * GET /api/orders/status?ids=order-id-1,order-id-2
 *
 * Public endpoint for customers to check order status.
 * Returns a map of order ID to status.
 */
export async function GET(request: NextRequest) {
  try {
    const ids = request.nextUrl.searchParams.get('ids');

    if (!ids) {
      return NextResponse.json(
        { success: false, error: 'Missing ids parameter' },
        { status: 400 }
      );
    }

    const orderIds = ids.split(',').slice(0, 20); // Max 20 orders per request

    if (orderIds.length === 0) {
      return NextResponse.json({ success: true, statuses: {} });
    }

    // Use admin client since this is a public endpoint (customers aren't authenticated)
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('orders')
      .select('id, status')
      .in('id', orderIds);

    if (error) {
      console.error('Order status fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch order statuses' },
        { status: 500 }
      );
    }

    const statuses: Record<string, string> = {};
    for (const row of data || []) {
      statuses[row.id] = row.status;
    }

    return NextResponse.json({ success: true, statuses });
  } catch (error) {
    console.error('GET /api/orders/status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
