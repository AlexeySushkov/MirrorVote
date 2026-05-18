-- Credit packs: replace Pro subscription with one-time credit purchases.
-- Credits don't expire. When exhausted, user falls back to free monthly limit.

DROP FUNCTION IF EXISTS public.consume_analysis_credit();
DROP FUNCTION IF EXISTS public.get_analysis_quota();

CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER     NOT NULL DEFAULT 0 CHECK (credits_remaining >= 0),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_credits_self" ON public.user_credits;
CREATE POLICY "user_credits_self" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Called from yookassa-webhook to add purchased credits.
CREATE OR REPLACE FUNCTION public.add_user_credits(p_user_id UUID, p_credits INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining)
  VALUES (p_user_id, p_credits)
  ON CONFLICT (user_id) DO UPDATE
    SET credits_remaining = user_credits.credits_remaining + EXCLUDED.credits_remaining,
        updated_at        = now();
END;
$$;

REVOKE ALL ON FUNCTION public.add_user_credits(UUID, INTEGER) FROM PUBLIC;

-- consume_analysis_credit: decrement credit pack first, then free monthly limit.
CREATE OR REPLACE FUNCTION public.consume_analysis_credit()
RETURNS TABLE (
  allowed        BOOLEAN,
  used           INTEGER,
  limit_count    INTEGER,
  remaining      INTEGER,
  plan_code      TEXT,
  period_yyyymm  INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID    := auth.uid();
  v_credits INTEGER;
  v_limit   INTEGER;
  v_period  INTEGER := (extract(year  from now())::INTEGER * 100
                      + extract(month from now())::INTEGER);
  v_used    INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Try to consume one purchased credit atomically.
  UPDATE public.user_credits
     SET credits_remaining = credits_remaining - 1,
         updated_at        = now()
   WHERE user_id           = v_user_id
     AND credits_remaining > 0
  RETURNING credits_remaining INTO v_credits;

  IF FOUND THEN
    RETURN QUERY SELECT true, 0, NULL::INTEGER, v_credits, 'credits'::TEXT, v_period;
    RETURN;
  END IF;

  -- No credits — fall back to free monthly limit.
  SELECT bpl.analysis_limit_monthly INTO v_limit
  FROM public.billing_plan_limits bpl
  WHERE bpl.plan_code = 'free';

  INSERT INTO public.usage_analytics_monthly (user_id, period_yyyymm, used_count, limit_count, plan_code)
  VALUES (v_user_id, v_period, 0, v_limit, 'free')
  ON CONFLICT (user_id, period_yyyymm) DO UPDATE
    SET plan_code   = EXCLUDED.plan_code,
        limit_count = EXCLUDED.limit_count,
        updated_at  = now();

  UPDATE public.usage_analytics_monthly uam
     SET used_count = uam.used_count + 1
   WHERE uam.user_id       = v_user_id
     AND uam.period_yyyymm = v_period
     AND uam.used_count    < v_limit
  RETURNING uam.used_count INTO v_used;

  IF FOUND THEN
    RETURN QUERY
    SELECT true, v_used, v_limit, greatest(v_limit - v_used, 0), 'free'::TEXT, v_period;
  ELSE
    SELECT uam.used_count INTO v_used
    FROM public.usage_analytics_monthly uam
    WHERE uam.user_id = v_user_id AND uam.period_yyyymm = v_period;

    RETURN QUERY
    SELECT false, coalesce(v_used, 0), v_limit, 0, 'free'::TEXT, v_period;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_analysis_credit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_analysis_credit() TO authenticated;

-- get_analysis_quota: show credit balance if non-zero, else free monthly quota.
CREATE OR REPLACE FUNCTION public.get_analysis_quota()
RETURNS TABLE (
  used           INTEGER,
  limit_count    INTEGER,
  remaining      INTEGER,
  plan_code      TEXT,
  period_yyyymm  INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID    := auth.uid();
  v_credits INTEGER;
  v_limit   INTEGER;
  v_period  INTEGER := (extract(year  from now())::INTEGER * 100
                      + extract(month from now())::INTEGER);
  v_used    INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT uc.credits_remaining INTO v_credits
  FROM public.user_credits uc
  WHERE uc.user_id = v_user_id;

  IF coalesce(v_credits, 0) > 0 THEN
    RETURN QUERY SELECT 0, NULL::INTEGER, v_credits, 'credits'::TEXT, v_period;
    RETURN;
  END IF;

  SELECT bpl.analysis_limit_monthly INTO v_limit
  FROM public.billing_plan_limits bpl
  WHERE bpl.plan_code = 'free';

  SELECT uam.used_count INTO v_used
  FROM public.usage_analytics_monthly uam
  WHERE uam.user_id = v_user_id AND uam.period_yyyymm = v_period;

  v_used := coalesce(v_used, 0);

  RETURN QUERY
  SELECT v_used, v_limit, greatest(v_limit - v_used, 0), 'free'::TEXT, v_period;
END;
$$;

REVOKE ALL ON FUNCTION public.get_analysis_quota() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_analysis_quota() TO authenticated;
