import { NextRequest, NextResponse } from 'next/server';
import { BetaSignupSchema } from '@/application/dtos/BetaSignupDTO';
import { SupabaseBetaSignupRepository } from '@/infrastructure/persistence/supabase/SupabaseBetaSignupRepository';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = BetaSignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const repository = new SupabaseBetaSignupRepository(adminClient);

    // Check for duplicates
    const exists = await repository.existsByInstagramHandle(parsed.data.instagramHandle);
    if (exists) {
      return NextResponse.json(
        { success: false, error: 'DUPLICATE' },
        { status: 409 }
      );
    }

    // Create signup
    const signup = await repository.create(parsed.data);

    return NextResponse.json({
      success: true,
      queuePosition: signup.queuePosition,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE') {
      return NextResponse.json(
        { success: false, error: 'DUPLICATE' },
        { status: 409 }
      );
    }

    console.error('Beta signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const adminClient = createAdminClient();
    const repository = new SupabaseBetaSignupRepository(adminClient);
    const count = await repository.getCount();

    return NextResponse.json({ count, total: 200 });
  } catch (error) {
    console.error('Beta count error:', error);
    return NextResponse.json({ count: 0, total: 200 });
  }
}
