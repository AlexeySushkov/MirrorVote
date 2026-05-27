-- Fix: get_public_session returned to_jsonb(s) which serialised the entire
-- mirror_sessions row, leaking user_id, ai_recommendation, best_photo_id,
-- share_token, store_name, status, etc. to anyone with the voting link.
-- Replace with an explicit jsonb_build_object exposing only the three fields
-- that VotePage actually needs: id, title, background.

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
  SELECT id INTO v_session_id
  FROM mirror_sessions
  WHERE share_token = p_token
  LIMIT 1;

  IF v_session_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'session', (
      SELECT jsonb_build_object(
        'id',         s.id,
        'title',      s.title,
        'background', s.background
      )
      FROM mirror_sessions s
      WHERE s.id = v_session_id
    ),
    'photos', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id',                  p.id,
          'photo_url',           p.photo_url,
          'processed_photo_url', p.processed_photo_url,
          'original_filename',   p.original_filename,
          'sort_order',          p.sort_order,
          'avg_rating', COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM mirror_votes
            WHERE session_id = p.session_id AND photo_id = p.id
          ), 0),
          'vote_count', COALESCE((
            SELECT COUNT(*)::int
            FROM mirror_votes
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
