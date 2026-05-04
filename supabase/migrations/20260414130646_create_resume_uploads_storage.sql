
/*
  # Create Storage Bucket for Resume Image Uploads

  1. Storage
    - Creates a private `resume-uploads` bucket for storing resume images
    - Only authenticated users can upload their own files
    - Files are scoped by user_id path prefix for isolation

  2. Security
    - RLS policies on storage.objects ensure users can only access their own uploads
    - Upload size is not restricted at DB level (handled by edge function)
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-uploads',
  'resume-uploads',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own resume images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resume-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own resume images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resume-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own resume images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resume-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
