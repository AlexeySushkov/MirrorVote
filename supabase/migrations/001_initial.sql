-- Mirror sessions table
CREATE TABLE public.mirror_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Примерка',
  store_name TEXT,
  status TEXT NOT NULL DEFAULT 'uploading' 
    CHECK (status IN ('uploading', 'normalizing', 'ready', 'analyzed')),
  best_photo_id UUID,
  ai_recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mirror photos table
CREATE TABLE public.mirror_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mirror_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  normalization JSONB DEFAULT NULL,
  analysis JSONB DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' 
    CHECK (status IN ('uploaded', 'normalizing', 'ready', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.mirror_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mirror_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mirror_sessions" ON public.mirror_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own mirror_sessions" ON public.mirror_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mirror_sessions" ON public.mirror_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mirror_sessions" ON public.mirror_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own mirror_photos" ON public.mirror_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own mirror_photos" ON public.mirror_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mirror_photos" ON public.mirror_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mirror_photos" ON public.mirror_photos FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_mirror_sessions_updated_at
BEFORE UPDATE ON public.mirror_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mirror_photos_updated_at
BEFORE UPDATE ON public.mirror_photos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
