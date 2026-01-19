/**
 * Supabase Storage Service
 *
 * Handles file uploads for vibe-related assets (maker bio images, pinned reviews).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export type ImageType = 'maker-bio' | 'pinned-review' | 'chat-screenshot';

const BUCKET_NAME = 'vibe-assets';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class SupabaseStorageService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly adminClient?: SupabaseClient
  ) {}

  /**
   * Upload an image to vibe-assets bucket
   * @param file - The file to upload
   * @param userId - The user's ID (used as folder prefix for RLS)
   * @param imageType - The type of image (maker-bio or pinned-review)
   * @param fileName - Optional custom filename
   */
  async uploadImage(
    file: File,
    userId: string,
    imageType: ImageType,
    fileName?: string
  ): Promise<UploadResult> {
    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Generate unique filename
    const extension = file.name.split('.').pop() || 'jpg';
    const uniqueName = fileName || `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const path = `${userId}/${imageType}/${uniqueName}`;

    // Use admin client for upload if available (bypasses RLS since auth is verified in API route)
    const uploadClient = this.adminClient || this.supabase;

    const { data, error } = await uploadClient.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const publicUrl = this.getPublicUrl(data.path);

    return {
      success: true,
      path: data.path,
      url: publicUrl,
    };
  }

  /**
   * Delete an image from vibe-assets bucket
   * @param path - The full path to the file (e.g., "userId/maker-bio/filename.jpg")
   */
  async deleteImage(path: string): Promise<DeleteResult> {
    // Use admin client for delete if available (bypasses RLS since auth is verified in API route)
    const deleteClient = this.adminClient || this.supabase;

    const { error } = await deleteClient.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  }

  /**
   * Get the public URL for a stored file
   * @param path - The file path within the bucket
   */
  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * List all images for a user by type
   * @param userId - The user's ID
   * @param imageType - The type of images to list
   */
  async listImages(userId: string, imageType: ImageType): Promise<string[]> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .list(`${userId}/${imageType}`);

    if (error || !data) {
      return [];
    }

    return data.map((file) => this.getPublicUrl(`${userId}/${imageType}/${file.name}`));
  }
}
