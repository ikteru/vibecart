import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';
import { getCustomerSession } from '@/infrastructure/auth/customer-session';

/**
 * GET /api/auth/customer/orders?shop=handle
 *
 * Fetch orders for the authenticated customer.
 * Requires a valid customer session cookie.
 * Optionally filters by shop handle.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify customer session
    const phone = await getCustomerSession();
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const shopHandle = request.nextUrl.searchParams.get('shop');
    const adminClient = createAdminClient();

    // Build query
    let query = adminClient
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        status,
        subtotal,
        shipping_cost,
        total,
        currency,
        fulfillment_type,
        pickup_code,
        created_at,
        seller_id,
        order_items (
          id,
          product_id,
          title,
          price,
          quantity,
          selected_variant
        )
      `)
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(50);

    // If shop handle provided, filter by seller
    if (shopHandle) {
      const { data: seller } = await adminClient
        .from('sellers')
        .select('id')
        .eq('handle', shopHandle)
        .single();

      if (seller) {
        query = query.eq('seller_id', seller.id);
      }
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Customer orders fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Map to customer-friendly format
    const mapped = (orders || []).map((order) => ({
      orderId: order.id,
      orderNumber: order.order_number,
      items: (order.order_items || []).map((item: {
        product_id: string;
        title: string;
        price: number;
        quantity: number;
        selected_variant?: string;
      }) => ({
        productId: item.product_id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        variant: item.selected_variant,
      })),
      total: order.total,
      currency: order.currency,
      status: order.status,
      fulfillmentType: order.fulfillment_type || 'delivery',
      pickupCode: order.pickup_code,
      createdAt: order.created_at,
    }));

    return NextResponse.json({ success: true, orders: mapped });
  } catch (error) {
    console.error('GET /api/auth/customer/orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
