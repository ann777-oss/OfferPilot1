/*
  # Fix profile photo storage policies

  Allows authenticated users to upload, update, and delete objects in the
  profile-photos bucket. The photo URL is still written through user_profiles
  RLS, so users can only attach photos to their own profile.
*/

DROP POLICY IF EXISTS "Users can upload own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete profile photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload profile photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can update profile photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-photos')
  WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can delete profile photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-photos');
