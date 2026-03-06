import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Instagram Webhook Handler
 *
 * Handles:
 * 1. GET - Webhook verification (Meta sends this when you configure webhooks in the portal)
 * 2. POST - Event notifications (comments, messages, mentions, story_insights)
 *
 * Environment variables:
 * - INSTAGRAM_WEBHOOK_VERIFY_TOKEN: The verify token you set in the Meta App Dashboard
 * - INSTAGRAM_APP_SECRET: Used to verify webhook payload signatures
 */

// GET - Webhook verification for Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Instagram Webhook] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('[Instagram Webhook] Verification failed', { mode, tokenMatch: token === verifyToken });
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST - Receive Instagram event notifications
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verify payload signature
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    if (appSecret && signature) {
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('[Instagram Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    // Log the event type for debugging (no sensitive data)
    console.log('[Instagram Webhook] Received event:', body.object, 'entries:', body.entry?.length || 0);

    // TODO: Process webhook events (comments, messages, mentions, etc.)
    // For now, just acknowledge receipt
    // Future: route to appropriate handlers based on body.entry[].changes[].field

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Instagram Webhook] Error:', error instanceof Error ? error.message : 'Unknown error');

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
