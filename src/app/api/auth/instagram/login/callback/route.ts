import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { InstagramGraphService } from '@/infrastructure/external-services/InstagramGraphService';
import { InstagramToken } from '@/domain/entities/InstagramToken';
import { encryptToken } from '@/infrastructure/utils/encryption';
import { CreateSellerFromInstagram } from '@/application/use-cases/instagram';

const OAUTH_STATE_COOKIE = 'instagram_login_state';
const DEFAULT_LOCALE = 'ar-MA';

/**
 * GET /api/auth/instagram/login/callback
 *
 * Instagram OAuth callback for login/signup flow.
 * Creates Supabase user + seller profile if needed.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const loginUrl = `${baseUrl}/${DEFAULT_LOCALE}/auth/login`;
  const dashboardUrl = `${baseUrl}/${DEFAULT_LOCALE}/seller/dashboard`;

  // Handle user denial
  if (error) {
    console.warn('Instagram login denied:', { error, errorDescription });
    const errorUrl = new URL(loginUrl);
    errorUrl.searchParams.set('instagram_error', errorDescription || 'Authorization denied');
    return NextResponse.redirect(errorUrl);
  }

  // Validate required params
  if (!code || !state) {
    const errorUrl = new URL(loginUrl);
    errorUrl.searchParams.set('instagram_error', 'Missing authorization parameters');
    return NextResponse.redirect(errorUrl);
  }

  try {
    // 1. Validate state cookie (CSRF protection)
    const cookieStore = await cookies();
    const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

    if (!expectedState || state !== expectedState) {
      const errorUrl = new URL(loginUrl);
      errorUrl.searchParams.set('instagram_error', 'Session expired. Please try again.');
      return NextResponse.redirect(errorUrl);
    }

    // Clear state cookie
    cookieStore.delete(OAUTH_STATE_COOKIE);

    // 2. Verify state data
    let stateData: { purpose: string; nonce: string; timestamp: number; from?: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    } catch {
      const errorUrl = new URL(loginUrl);
      errorUrl.searchParams.set('instagram_error', 'Invalid session. Please try again.');
      return NextResponse.redirect(errorUrl);
    }

    if (stateData.purpose !== 'login') {
      const errorUrl = new URL(loginUrl);
      errorUrl.searchParams.set('instagram_error', 'Invalid flow. Please try again.');
      return NextResponse.redirect(errorUrl);
    }

    // Check state expiry (10 minutes)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      const errorUrl = new URL(loginUrl);
      errorUrl.searchParams.set('instagram_error', 'Authorization expired. Please try again.');
      return NextResponse.redirect(errorUrl);
    }

    // 3. Exchange code for tokens
    const loginCallbackUri = `${baseUrl}/api/auth/instagram/login/callback`;
    const instagramService = new InstagramGraphService();

    const shortLivedToken = await instagramService.exchangeCodeForToken(code, loginCallbackUri);

    // Try to get long-lived token; fall back to short-lived if permissions not yet approved
    let accessToken = shortLivedToken.access_token;
    let tokenExpiresIn = 3600; // short-lived: ~1 hour
    try {
      const longLivedToken = await instagramService.getLongLivedToken(shortLivedToken.access_token);
      accessToken = longLivedToken.access_token;
      tokenExpiresIn = longLivedToken.expires_in;
    } catch (tokenError) {
      console.warn('Long-lived token exchange failed (likely pending App Review), using short-lived token:', tokenError);
    }

    const profile = await instagramService.getUserProfile(accessToken);

    // 4. Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenExpiresIn);

    // 5. Find or create Supabase user
    const adminClient = createAdminClient();
    const syntheticEmail = `ig_${profile.id}@instagram.vibecart.app`;

    let userId: string;
    let isNewUser = false;

    // Check if user exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === syntheticEmail
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: syntheticEmail,
        email_confirm: true,
        user_metadata: {
          instagram_id: profile.id,
          instagram_username: profile.username,
          avatar_url: profile.profile_picture_url,
        },
      });

      if (createError || !newUser.user) {
        console.error('Failed to create user:', createError);
        const errorUrl = new URL(loginUrl);
        errorUrl.searchParams.set('instagram_error', 'Failed to create account');
        return NextResponse.redirect(errorUrl);
      }

      userId = newUser.user.id;
      isNewUser = true;
    }

    // 6. Generate magic link to create session
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: syntheticEmail,
    });

    if (linkError || !linkData) {
      console.error('Failed to generate session link:', linkError);
      const errorUrl = new URL(loginUrl);
      errorUrl.searchParams.set('instagram_error', 'Failed to create session');
      return NextResponse.redirect(errorUrl);
    }

    // 7. Find or create seller
    const { sellerRepository, instagramTokenRepository } = createRepositories(adminClient, adminClient);

    let seller = await sellerRepository.findByUserId(userId);
    let justCreatedSeller = false;

    if (!seller) {
      const createSellerUseCase = new CreateSellerFromInstagram(sellerRepository);
      const sellerResult = await createSellerUseCase.execute({
        userId,
        instagramProfile: {
          username: profile.username,
          id: profile.id,
          followers_count: profile.followers_count,
          profile_picture_url: profile.profile_picture_url,
        },
        tokenExpiresAt: expiresAt.toISOString(),
      });

      if (!sellerResult.success || !sellerResult.seller) {
        console.error('Failed to create seller:', sellerResult.error);
        const errorUrl = new URL(loginUrl);
        errorUrl.searchParams.set('instagram_error', 'Failed to create shop');
        return NextResponse.redirect(errorUrl);
      }

      seller = sellerResult.seller;
      justCreatedSeller = true;
    } else {
      // Update existing seller's Instagram config
      seller.updateShopConfig({
        instagram: {
          isConnected: true,
          handle: profile.username,
          userId: profile.id,
          tokenExpiresAt: expiresAt.toISOString(),
          followersCount: profile.followers_count,
          profilePictureUrl: profile.profile_picture_url,
        },
      });
      await sellerRepository.save(seller);
    }

    // 8. Store encrypted Instagram token
    const encryptedToken = encryptToken(accessToken);
    const instagramToken = InstagramToken.create({
      sellerId: seller.id,
      instagramUserId: profile.id,
      instagramUsername: profile.username,
      accessTokenEncrypted: encryptedToken,
      tokenType: 'bearer',
      expiresAt,
      scopes: ['instagram_business_basic', 'instagram_business_content_publish'],
    });

    await instagramTokenRepository.save(instagramToken);

    // 9. Set session via Supabase auth
    // Use the hashed token from generateLink to verify OTP
    const token_hash = linkData.properties?.hashed_token;
    if (token_hash) {
      // Set the session cookie by verifying the OTP
      const { createClient } = await import('@/infrastructure/auth/supabase-server');
      const supabase = await createClient();
      await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash,
      });
    }

    // 10. Redirect — beta signup success or dashboard
    if (stateData.from === 'beta' && (isNewUser || justCreatedSeller)) {
      const successUrl = new URL(`${baseUrl}/${DEFAULT_LOCALE}`);
      successUrl.searchParams.set('signup', 'success');
      return NextResponse.redirect(successUrl);
    }

    const redirectUrl = new URL(dashboardUrl);
    if (isNewUser || justCreatedSeller) {
      redirectUrl.searchParams.set('welcome', 'true');
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Instagram login callback error:', error);
    const errorUrl = new URL(loginUrl);
    errorUrl.searchParams.set('instagram_error', 'An unexpected error occurred');
    return NextResponse.redirect(errorUrl);
  }
}
