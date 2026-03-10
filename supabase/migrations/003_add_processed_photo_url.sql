-- Add processed (Clear Look) photo URL for image-to-image pipeline
ALTER TABLE public.mirror_photos
ADD COLUMN IF NOT EXISTS processed_photo_url TEXT;
