/**
 * Customer Session Management
 *
 * Passwordless authentication for customers via WhatsApp magic links.
 * Uses HMAC-signed cookies (no external JWT library needed).
 *
 * Flow:
 * 1. Customer enters phone number → token generated, WhatsApp link sent
 * 2. Customer clicks link → token verified, session cookie set
 * 3. Session cookie read on subsequent requests to identify customer
 */

import { createHmac, randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'vibecart_customer';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const TOKEN_EXPIRY_MINUTES = 10;

interface CustomerSession {
  phone: string; // Normalized: 212XXXXXXXXX
  exp: number;   // Expiry timestamp (seconds)
}

// ---------------------------------------------------------------------------
// Secret key
// ---------------------------------------------------------------------------

function getSecret(): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('CUSTOMER_SESSION_SECRET or ENCRYPTION_KEY must be configured');
  }
  return secret;
}

// ---------------------------------------------------------------------------
// Token generation (for magic links)
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically secure random token for magic links.
 * 32 bytes = 64 hex chars, URL-safe.
 */
export function generateLoginToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Get the token expiry date (10 minutes from now).
 */
export function getTokenExpiry(): Date {
  return new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Session cookie (HMAC-signed)
// ---------------------------------------------------------------------------

/**
 * Sign a payload with HMAC-SHA256.
 * Format: base64(payload).signature
 */
function signPayload(payload: CustomerSession): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', getSecret()).update(data).digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Verify and decode an HMAC-signed session string.
 * Returns null if invalid or expired.
 */
function verifyPayload(signed: string): CustomerSession | null {
  const parts = signed.split('.');
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  const expectedSignature = createHmac('sha256', getSecret()).update(data).digest('base64url');

  // Constant-time comparison
  if (signature.length !== expectedSignature.length) return null;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  try {
    const payload: CustomerSession = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf-8')
    );

    // Check expiry
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie operations
// ---------------------------------------------------------------------------

/**
 * Create a signed session cookie value for a customer phone number.
 */
export function createSessionToken(phone: string): string {
  const payload: CustomerSession = {
    phone,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  return signPayload(payload);
}

/**
 * Read and verify the customer session from cookies.
 * Returns the phone number if valid, null otherwise.
 *
 * Use in server components and API routes.
 */
export async function getCustomerSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  const session = verifyPayload(cookie.value);
  return session?.phone ?? null;
}

/**
 * Get cookie configuration for setting the session cookie.
 * Used in route handlers where we set cookies on the response.
 */
export function getSessionCookieConfig(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_MAX_AGE,
    path: '/',
  };
}

/**
 * Get cookie config for clearing the session.
 */
export function getClearSessionCookieConfig() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
}

export { COOKIE_NAME, SESSION_MAX_AGE };
