import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';
import { generateLoginToken, getTokenExpiry } from '@/infrastructure/auth/customer-session';
import { validateAndFormatPhone } from '@/presentation/validation/checkoutSchema';
import { WeslatBrokerService } from '@/infrastructure/external-services/WeslatBrokerService';

/**
 * POST /api/auth/customer/request
 *
 * Request a WhatsApp login link.
 * Generates a secure token, stores it, and sends the magic link via WhatsApp.
 *
 * Body: { phone: string, redirectUrl?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, redirectUrl } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate and normalize phone
    const phoneResult = validateAndFormatPhone(phone);
    if (!phoneResult.valid || !phoneResult.formatted) {
      return NextResponse.json(
        { success: false, error: phoneResult.error || 'Invalid phone number' },
        { status: 400 }
      );
    }

    const normalizedPhone = phoneResult.formatted; // 212XXXXXXXXX

    // Check if this phone has any orders (only customers with orders can log in)
    const adminClient = createAdminClient();
    const { count } = await adminClient
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_phone', normalizedPhone);

    if (!count || count === 0) {
      // Don't reveal whether the phone exists — return success anyway
      // This prevents phone enumeration attacks
      return NextResponse.json({ success: true });
    }

    // Rate limit: max 3 tokens per phone in last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: recentCount } = await adminClient
      .from('customer_login_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('phone', normalizedPhone)
      .gte('created_at', tenMinutesAgo);

    if (recentCount && recentCount >= 3) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please wait a few minutes.' },
        { status: 429 }
      );
    }

    // Generate token and store it
    const token = generateLoginToken();
    const expiresAt = getTokenExpiry();

    const { error: insertError } = await adminClient
      .from('customer_login_tokens')
      .insert({
        phone: normalizedPhone,
        token,
        redirect_url: redirectUrl || null,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to create login token:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to send login link' },
        { status: 500 }
      );
    }

    // Build the magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const verifyUrl = `${baseUrl}/api/auth/customer/verify?token=${token}`;

    // Send via WhatsApp (Weslat broker)
    try {
      const platformApiKey = process.env.WESLAT_PLATFORM_API_KEY;
      if (!platformApiKey) {
        console.error('WESLAT_PLATFORM_API_KEY not configured — cannot send login link');
        // Still return success since the token was created (useful for dev/testing)
        return NextResponse.json({ success: true });
      }

      const weslat = new WeslatBrokerService();
      await weslat.sendMessage({
        apiKey: platformApiKey,
        templateName: 'customer_login',
        recipient: normalizedPhone,
        templateParams: [verifyUrl],
        metadata: {
          type: 'customer_login',
          phone: normalizedPhone,
        },
      });
    } catch (whatsappError) {
      // Log but don't fail — the token is created, user might retry
      console.error('Failed to send WhatsApp login link:', whatsappError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/auth/customer/request error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
