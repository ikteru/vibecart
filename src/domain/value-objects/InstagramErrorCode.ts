/**
 * Instagram Error Codes
 *
 * Shared error codes used in OAuth redirect URLs.
 * Maps to i18n keys: auth.instagramErrors.<code>
 */

import { InstagramApiError, InstagramErrorType } from './InstagramApiError';

export const INSTAGRAM_ERROR_CODES = {
  DENIED: 'denied',
  MISSING_PARAMS: 'missing_params',
  SESSION_EXPIRED: 'session_expired',
  INVALID_SESSION: 'invalid_session',
  AUTH_EXPIRED: 'auth_expired',
  ACCOUNT_FAILED: 'account_failed',
  SESSION_FAILED: 'session_failed',
  SHOP_FAILED: 'shop_failed',
  CONNECTION_FAILED: 'connection_failed',
  LOGIN_REQUIRED: 'login_required',
  RATE_LIMITED: 'rate_limited',
  PERMISSION_DENIED: 'permission_denied',
  TEMPORARY_ERROR: 'temporary_error',
  UNEXPECTED: 'unexpected',
} as const;

export type InstagramErrorCode = (typeof INSTAGRAM_ERROR_CODES)[keyof typeof INSTAGRAM_ERROR_CODES];

/**
 * All valid error codes for runtime validation
 */
const VALID_CODES = new Set<string>(Object.values(INSTAGRAM_ERROR_CODES));

/**
 * Check if a string is a valid Instagram error code
 */
export function isValidInstagramErrorCode(code: string): code is InstagramErrorCode {
  return VALID_CODES.has(code);
}

/**
 * Map an InstagramApiError to a user-facing error code
 */
export function mapInstagramErrorToCode(error: InstagramApiError): InstagramErrorCode {
  switch (error.errorType) {
    case InstagramErrorType.AUTH_EXPIRED:
      return INSTAGRAM_ERROR_CODES.AUTH_EXPIRED;
    case InstagramErrorType.AUTH_REVOKED:
      return INSTAGRAM_ERROR_CODES.CONNECTION_FAILED;
    case InstagramErrorType.RATE_LIMITED:
      return INSTAGRAM_ERROR_CODES.RATE_LIMITED;
    case InstagramErrorType.PERMISSION_DENIED:
      return INSTAGRAM_ERROR_CODES.PERMISSION_DENIED;
    case InstagramErrorType.TRANSIENT:
      return INSTAGRAM_ERROR_CODES.TEMPORARY_ERROR;
    default:
      return INSTAGRAM_ERROR_CODES.UNEXPECTED;
  }
}
