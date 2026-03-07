-- Storage policies for mirror_photos bucket
-- Users can upload files into their own folder (userId/...)
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mirror_photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own photos
CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'mirror_photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own photos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'mirror_photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mirror_photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
