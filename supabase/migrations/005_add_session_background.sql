-- Store selected background (Simple Look) in session for display in cards and voting
ALTER TABLE public.mirror_sessions
ADD COLUMN IF NOT EXISTS background TEXT;
