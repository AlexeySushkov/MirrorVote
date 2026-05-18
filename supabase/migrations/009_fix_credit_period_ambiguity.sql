-- Fix ambiguous "period_yyyymm" in consume_analysis_credit:
-- ON CONFLICT column list is ambiguous when the function RETURNS TABLE
-- has an output column with the same name. Use named constraint instead.

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
  ON CONFLICT ON CONSTRAINT usage_analytics_monthly_pkey DO UPDATE
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
