-- Add share_token to mirror_sessions for public voting links
ALTER TABLE public.mirror_sessions
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- mirror_votes: ratings 1-5 stars per photo per fingerprint
CREATE TABLE public.mirror_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mirror_sessions(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.mirror_photos(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, photo_id, fingerprint)
);

ALTER TABLE public.mirror_votes ENABLE ROW LEVEL SECURITY;

-- No direct client access to mirror_votes; use RPC only
CREATE POLICY "mirror_votes_no_direct_access" ON public.mirror_votes
  FOR ALL USING (false);

-- get_public_session: returns session + photos with avg_rating and vote_count
CREATE OR REPLACE FUNCTION public.get_public_session(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_result JSONB;
BEGIN
  SELECT id INTO v_session_id FROM mirror_sessions WHERE share_token = p_token LIMIT 1;
  IF v_session_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'session', (SELECT to_jsonb(s) FROM mirror_sessions s WHERE s.id = v_session_id),
    'photos', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'photo_url', p.photo_url,
          'processed_photo_url', p.processed_photo_url,
          'original_filename', p.original_filename,
          'sort_order', p.sort_order,
          'avg_rating', COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2) FROM mirror_votes
            WHERE session_id = p.session_id AND photo_id = p.id
          ), 0),
          'vote_count', COALESCE((
            SELECT COUNT(*)::int FROM mirror_votes
            WHERE session_id = p.session_id AND photo_id = p.id
          ), 0)
        )
        ORDER BY p.sort_order
      ), '[]'::jsonb)
      FROM mirror_photos p
      WHERE p.session_id = v_session_id
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- submit_rating: insert or update rating for a photo
CREATE OR REPLACE FUNCTION public.submit_rating(
  p_token TEXT,
  p_photo_id UUID,
  p_fingerprint TEXT,
  p_rating INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  SELECT id INTO v_session_id FROM mirror_sessions WHERE share_token = p_token LIMIT 1;
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired link';
  END IF;

  INSERT INTO mirror_votes (session_id, photo_id, fingerprint, rating)
  VALUES (v_session_id, p_photo_id, p_fingerprint, p_rating)
  ON CONFLICT (session_id, photo_id, fingerprint)
  DO UPDATE SET rating = p_rating;
END;
$$;

-- Allow anonymous and authenticated users to call voting RPCs
GRANT EXECUTE ON FUNCTION public.get_public_session(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_rating(TEXT, UUID, TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_rating(TEXT, UUID, TEXT, INTEGER) TO authenticated;
