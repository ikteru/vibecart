/**
 * Instagram DTOs
 *
 * Data Transfer Objects for Instagram-related operations.
 */

export interface InstagramMediaDTO {
  id: string;
  mediaType: 'VIDEO' | 'IMAGE' | 'CAROUSEL_ALBUM';
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

export interface InstagramConnectionDTO {
  isConnected: boolean;
  username?: string;
  userId?: string;
  expiresAt?: string;
  needsRefresh?: boolean;
}

export interface InstagramAuthResultDTO {
  success: boolean;
  connection?: InstagramConnectionDTO;
  error?: string;
}

export interface InstagramMediaListDTO {
  media: InstagramMediaDTO[];
  hasMore: boolean;
  cursor?: string;
}
