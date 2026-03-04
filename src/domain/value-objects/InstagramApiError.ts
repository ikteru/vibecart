/**
 * Instagram API Error Classification
 *
 * Parses structured error responses from Instagram's Graph API
 * and classifies them into actionable error types.
 *
 * Instagram error format:
 * { error: { message, type, code, error_subcode, fbtrace_id } }
 *
 * Key codes:
 * - 190: Invalid/expired access token
 *   - subcode 463: Token expired
 *   - subcode 467: Token invalid
 * - 10: Permission denied
 * - 4: Rate limit exceeded
 * - 100: Invalid parameter
 * - 803: Resource not found
 */

export enum InstagramErrorType {
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_REVOKED = 'AUTH_REVOKED',
  RATE_LIMITED = 'RATE_LIMITED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  MEDIA_NOT_FOUND = 'MEDIA_NOT_FOUND',
  TRANSIENT = 'TRANSIENT',
  UNKNOWN = 'UNKNOWN',
}

export class InstagramApiError extends Error {
  public readonly errorType: InstagramErrorType;
  public readonly code: number;
  public readonly subcode: number | undefined;
  public readonly fbtraceId: string | undefined;
  public readonly httpStatus: number;

  constructor(
    errorType: InstagramErrorType,
    code: number,
    httpStatus: number,
    message: string,
    subcode?: number,
    fbtraceId?: string
  ) {
    super(message);
    this.name = 'InstagramApiError';
    this.errorType = errorType;
    this.code = code;
    this.subcode = subcode;
    this.fbtraceId = fbtraceId;
    this.httpStatus = httpStatus;
  }

  /**
   * Parse an Instagram API error response into a typed error
   */
  static fromResponse(
    body: Record<string, unknown> | null,
    httpStatus: number
  ): InstagramApiError {
    const errorObj = (body?.error ?? body) as Record<string, unknown> | undefined;
    const code = (errorObj?.code as number) ?? 0;
    const subcode = errorObj?.error_subcode as number | undefined;
    const message =
      (errorObj?.message as string) ??
      (errorObj?.error_message as string) ??
      `Instagram API error (HTTP ${httpStatus})`;
    const fbtraceId = errorObj?.fbtrace_id as string | undefined;

    const errorType = InstagramApiError.classify(code, subcode, httpStatus);

    return new InstagramApiError(
      errorType,
      code,
      httpStatus,
      message,
      subcode,
      fbtraceId
    );
  }

  /**
   * Classify error based on Instagram error codes
   */
  private static classify(
    code: number,
    subcode: number | undefined,
    httpStatus: number
  ): InstagramErrorType {
    // Code 190: Invalid/expired access token
    if (code === 190) {
      if (subcode === 463) return InstagramErrorType.AUTH_EXPIRED;
      if (subcode === 467) return InstagramErrorType.AUTH_REVOKED;
      // Default 190 = treat as revoked (needs reconnect)
      return InstagramErrorType.AUTH_REVOKED;
    }

    // Code 10: Permission denied
    if (code === 10) return InstagramErrorType.PERMISSION_DENIED;

    // Code 4: Rate limit
    if (code === 4) return InstagramErrorType.RATE_LIMITED;

    // Code 100 with subcode 33: Object does not exist
    if (code === 100 && subcode === 33) return InstagramErrorType.MEDIA_NOT_FOUND;

    // Code 803: Resource not found
    if (code === 803) return InstagramErrorType.MEDIA_NOT_FOUND;

    // HTTP-based fallbacks
    if (httpStatus === 401 || httpStatus === 403) {
      return InstagramErrorType.AUTH_REVOKED;
    }
    if (httpStatus === 429) return InstagramErrorType.RATE_LIMITED;
    if (httpStatus === 404) return InstagramErrorType.MEDIA_NOT_FOUND;
    if (httpStatus >= 500) return InstagramErrorType.TRANSIENT;

    return InstagramErrorType.UNKNOWN;
  }

  /**
   * Whether this error means the token is invalid and user must reconnect
   */
  get requiresReconnect(): boolean {
    return (
      this.errorType === InstagramErrorType.AUTH_EXPIRED ||
      this.errorType === InstagramErrorType.AUTH_REVOKED ||
      this.errorType === InstagramErrorType.PERMISSION_DENIED
    );
  }

  get isAuthError(): boolean {
    return (
      this.errorType === InstagramErrorType.AUTH_EXPIRED ||
      this.errorType === InstagramErrorType.AUTH_REVOKED
    );
  }

  get isRateLimited(): boolean {
    return this.errorType === InstagramErrorType.RATE_LIMITED;
  }

  get isTransient(): boolean {
    return this.errorType === InstagramErrorType.TRANSIENT;
  }

  get isMediaNotFound(): boolean {
    return this.errorType === InstagramErrorType.MEDIA_NOT_FOUND;
  }
}
