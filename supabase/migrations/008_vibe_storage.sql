-- Migration: 008_vibe_storage.sql
-- Description: Create storage bucket for vibe-related assets (maker bio images, pinned review images)

-- Create the vibe-assets storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vibe-assets',
  'vibe-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Sellers can upload images to their own folder
-- Folder structure: {userId}/{imageType}/{filename}
CREATE POLICY "Sellers can upload their own vibe assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vibe-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Sellers can update their own vibe assets
CREATE POLICY "Sellers can update their own vibe assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vibe-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Sellers can delete their own vibe assets
CREATE POLICY "Sellers can delete their own vibe assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vibe-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Anyone can view vibe assets (public shop images)
CREATE POLICY "Anyone can view vibe assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vibe-assets');
