import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/infrastructure/utils/logger';

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
    logger.info('Instagram webhook verification successful', { context: 'instagram-webhook' });
    return new NextResponse(challenge, { status: 200 });
  }

  logger.warn('Instagram webhook verification failed', { context: 'instagram-webhook', mode, tokenMatch: token === verifyToken });
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
        logger.error('Instagram webhook invalid signature', { context: 'instagram-webhook' });
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    // Route events based on entry[].changes[].field
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const field = change.field;
        logger.info('Instagram webhook event received', {
          context: 'instagram-webhook',
          object: body.object,
          field,
          entryId: entry.id,
        });

        switch (field) {
          case 'comments':
            logger.debug('Comment event', { context: 'instagram-webhook', mediaId: change.value?.media_id });
            break;
          case 'mentions':
            logger.debug('Mention event', { context: 'instagram-webhook', mediaId: change.value?.media_id });
            break;
          case 'messages':
            logger.debug('Message event', { context: 'instagram-webhook' });
            break;
          case 'story_insights':
            logger.debug('Story insights event', { context: 'instagram-webhook' });
            break;
          default:
            logger.debug('Unhandled webhook field', { context: 'instagram-webhook', field });
        }
      }

      // Handle entries without changes (e.g., direct messaging format)
      if (changes.length === 0 && entry.messaging) {
        logger.info('Instagram messaging event', {
          context: 'instagram-webhook',
          entryId: entry.id,
          messageCount: entry.messaging?.length || 0,
        });
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Instagram webhook error', {
      context: 'instagram-webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
