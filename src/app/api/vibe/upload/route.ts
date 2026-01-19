import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient, getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { SupabaseStorageService, type ImageType } from '@/infrastructure/storage';

const VALID_IMAGE_TYPES: ImageType[] = ['maker-bio', 'pinned-review'];

/**
 * POST /api/vibe/upload
 *
 * Upload an image for vibe features (maker bio or pinned review).
 *
 * Body: FormData with:
 * - file: The image file
 * - type: 'maker-bio' | 'pinned-review'
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const imageType = formData.get('type') as ImageType | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate image type
    if (!imageType || !VALID_IMAGE_TYPES.includes(imageType)) {
      return NextResponse.json(
        { success: false, error: `Invalid image type. Must be one of: ${VALID_IMAGE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Upload using storage service
    const supabase = await createClient();
    const storageService = new SupabaseStorageService(supabase);
    const result = await storageService.uploadImage(file, user.id, imageType);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });
  } catch (error) {
    console.error('POST /api/vibe/upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vibe/upload
 *
 * Delete a previously uploaded image.
 *
 * Body: JSON with:
 * - path: The storage path of the image to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { path } = body;

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'No path provided' },
        { status: 400 }
      );
    }

    // Verify the path belongs to the current user (security check)
    if (!path.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this file' },
        { status: 403 }
      );
    }

    // Delete using storage service
    const supabase = await createClient();
    const storageService = new SupabaseStorageService(supabase);
    const result = await storageService.deleteImage(path);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/vibe/upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
