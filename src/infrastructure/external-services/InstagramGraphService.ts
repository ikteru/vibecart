/**
 * Instagram Graph API Service
 *
 * Handles all interactions with Instagram's Graph API including:
 * - OAuth authorization flow
 * - Token exchange and refresh
 * - Media fetching
 */

const INSTAGRAM_API_BASE = 'https://api.instagram.com';
const GRAPH_API_BASE = 'https://graph.instagram.com';

export interface TokenResponse {
  access_token: string;
  user_id: number;
}

export interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds (typically 5184000 = 60 days)
}

export interface RefreshedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface InstagramProfile {
  id: string;
  username: string;
  account_type: string;
  media_count?: number;
  followers_count?: number;
  profile_picture_url?: string;
}

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

export interface MediaListResponse {
  data: InstagramMedia[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export class InstagramGraphService {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;

  constructor() {
    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!appId) {
      throw new Error('INSTAGRAM_APP_ID is not set');
    }
    if (!appSecret) {
      throw new Error('INSTAGRAM_APP_SECRET is not set');
    }
    if (!redirectUri) {
      throw new Error('INSTAGRAM_REDIRECT_URI is not set');
    }

    this.appId = appId;
    this.appSecret = appSecret;
    this.redirectUri = redirectUri;
  }

  /**
   * Generate the Instagram authorization URL
   *
   * @param state - CSRF protection token (store in cookie/session)
   * @returns URL to redirect user to for authorization
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: 'instagram_business_basic,instagram_business_content_publish',
      response_type: 'code',
      state,
    });

    return `${INSTAGRAM_API_BASE}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for short-lived access token
   *
   * @param code - Authorization code from OAuth callback
   * @returns Short-lived token (valid ~1 hour)
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
      code,
    });

    const response = await fetch(`${INSTAGRAM_API_BASE}/oauth/access_token`, {
      method: 'POST',
      body: params,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to exchange code: ${error.error_message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Exchange short-lived token for long-lived token
   *
   * @param shortLivedToken - Short-lived access token
   * @returns Long-lived token (valid 60 days)
   */
  async getLongLivedToken(shortLivedToken: string): Promise<LongLivedTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: this.appSecret,
      access_token: shortLivedToken,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/access_token?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get long-lived token: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Refresh a long-lived token before it expires
   *
   * @param token - Current long-lived access token
   * @returns New long-lived token (valid 60 days from now)
   */
  async refreshToken(token: string): Promise<RefreshedTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: token,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/refresh_access_token?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to refresh token: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get the user's Instagram profile
   *
   * @param token - Access token
   * @returns User profile information
   */
  async getUserProfile(token: string): Promise<InstagramProfile> {
    const params = new URLSearchParams({
      fields: 'id,username,account_type,media_count,followers_count,profile_picture_url',
      access_token: token,
    });

    const response = await fetch(`${GRAPH_API_BASE}/me?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get user profile: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get the user's media (posts, reels, etc.)
   *
   * @param token - Access token
   * @param options - Pagination options
   * @returns List of media items
   */
  async getUserMedia(
    token: string,
    options?: { limit?: number; after?: string }
  ): Promise<MediaListResponse> {
    const params = new URLSearchParams({
      fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp',
      access_token: token,
    });

    if (options?.limit) {
      params.set('limit', options.limit.toString());
    }

    if (options?.after) {
      params.set('after', options.after);
    }

    const response = await fetch(
      `${GRAPH_API_BASE}/me/media?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get user media: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get a specific media item by ID
   *
   * @param mediaId - Instagram media ID
   * @param token - Access token
   * @returns Media item details
   */
  async getMedia(mediaId: string, token: string): Promise<InstagramMedia> {
    const params = new URLSearchParams({
      fields: 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp',
      access_token: token,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/${mediaId}?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get media: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }
}
