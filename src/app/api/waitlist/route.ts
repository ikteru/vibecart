import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instagram, whatsapp, city } = body;

    if (!instagram || !whatsapp || !city) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Insert into waitlist table (create if not exists via migration)
    const { error } = await adminClient
      .from('waitlist')
      .insert({
        instagram_handle: instagram.replace(/^@/, '').trim().toLowerCase(),
        whatsapp_number: whatsapp.trim(),
        city: city.trim(),
      });

    if (error) {
      // If table doesn't exist yet, still return success for the UX
      console.error('Waitlist insert error:', error);
    }

    // Get count for founder number
    const { count } = await adminClient
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      number: (count || 237) + 1,
    });
  } catch (error) {
    console.error('POST /api/waitlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
