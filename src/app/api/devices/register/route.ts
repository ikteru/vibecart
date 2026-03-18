import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';

/**
 * POST /api/devices/register
 *
 * Registers a device push notification token.
 * Called by the Capacitor app on launch.
 */
export async function POST(request: NextRequest) {
  try {
    const { token, platform } = await request.json();

    if (!token || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing token or platform' },
        { status: 400 }
      );
    }

    if (!['android', 'ios'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'Invalid platform' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Upsert by token (avoid duplicates)
    const { error } = await adminClient
      .from('device_tokens')
      .upsert(
        {
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

    if (error) {
      console.error('Device token registration error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to register device' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/devices/register error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
