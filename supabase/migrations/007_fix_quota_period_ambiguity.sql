-- Fix ambiguous "period_yyyymm" references in quota RPCs.
-- Root cause: function output column name can conflict with SQL column names.

CREATE OR REPLACE FUNCTION public.consume_analysis_credit()
RETURNS TABLE (
  allowed BOOLEAN,
  used INTEGER,
  limit_count INTEGER,
  remaining INTEGER,
  plan_code TEXT,
  period_yyyymm INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan TEXT;
  v_status TEXT;
  v_limit INTEGER;
  v_period INTEGER := (extract(year from now())::INTEGER * 100 + extract(month from now())::INTEGER);
  v_used INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT bs.plan_code, bs.status
    INTO v_plan, v_status
  FROM public.billing_subscriptions bs
  WHERE bs.user_id = v_user_id;

  IF v_plan IS NULL THEN
    v_plan := 'free';
    v_status := 'active';
  END IF;

  IF v_plan <> 'free' AND coalesce(v_status, 'active') <> 'active' THEN
    v_plan := 'free';
  END IF;

  SELECT bpl.analysis_limit_monthly
    INTO v_limit
  FROM public.billing_plan_limits bpl
  WHERE bpl.plan_code = v_plan;

  IF NOT FOUND THEN
    v_plan := 'free';
    SELECT bpl.analysis_limit_monthly
      INTO v_limit
    FROM public.billing_plan_limits bpl
    WHERE bpl.plan_code = 'free';
  END IF;

  INSERT INTO public.usage_analytics_monthly (user_id, period_yyyymm, used_count, limit_count, plan_code)
  VALUES (v_user_id, v_period, 0, v_limit, v_plan)
  ON CONFLICT (user_id, period_yyyymm) DO UPDATE
    SET plan_code = EXCLUDED.plan_code,
        limit_count = EXCLUDED.limit_count,
        updated_at = now();

  IF v_limit IS NULL THEN
    UPDATE public.usage_analytics_monthly uam
      SET used_count = uam.used_count + 1
    WHERE uam.user_id = v_user_id
      AND uam.period_yyyymm = v_period
    RETURNING uam.used_count INTO v_used;

    RETURN QUERY
    SELECT true, v_used, NULL::INTEGER, NULL::INTEGER, v_plan, v_period;
    RETURN;
  END IF;

  UPDATE public.usage_analytics_monthly uam
     SET used_count = uam.used_count + 1
   WHERE uam.user_id = v_user_id
     AND uam.period_yyyymm = v_period
     AND uam.used_count < v_limit
  RETURNING uam.used_count INTO v_used;

  IF FOUND THEN
    RETURN QUERY
    SELECT true, v_used, v_limit, greatest(v_limit - v_used, 0), v_plan, v_period;
  ELSE
    SELECT uam.used_count
      INTO v_used
    FROM public.usage_analytics_monthly uam
    WHERE uam.user_id = v_user_id
      AND uam.period_yyyymm = v_period;

    RETURN QUERY
    SELECT false, coalesce(v_used, 0), v_limit, 0, v_plan, v_period;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_analysis_credit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_analysis_credit() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_analysis_quota()
RETURNS TABLE (
  used INTEGER,
  limit_count INTEGER,
  remaining INTEGER,
  plan_code TEXT,
  period_yyyymm INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan TEXT;
  v_status TEXT;
  v_limit INTEGER;
  v_period INTEGER := (extract(year from now())::INTEGER * 100 + extract(month from now())::INTEGER);
  v_used INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT bs.plan_code, bs.status
    INTO v_plan, v_status
  FROM public.billing_subscriptions bs
  WHERE bs.user_id = v_user_id;

  IF v_plan IS NULL THEN
    v_plan := 'free';
    v_status := 'active';
  END IF;

  IF v_plan <> 'free' AND coalesce(v_status, 'active') <> 'active' THEN
    v_plan := 'free';
  END IF;

  SELECT bpl.analysis_limit_monthly
    INTO v_limit
  FROM public.billing_plan_limits bpl
  WHERE bpl.plan_code = v_plan;

  IF NOT FOUND THEN
    v_plan := 'free';
    SELECT bpl.analysis_limit_monthly
      INTO v_limit
    FROM public.billing_plan_limits bpl
    WHERE bpl.plan_code = 'free';
  END IF;

  SELECT uam.used_count
    INTO v_used
  FROM public.usage_analytics_monthly uam
  WHERE uam.user_id = v_user_id
    AND uam.period_yyyymm = v_period;

  v_used := coalesce(v_used, 0);

  RETURN QUERY
  SELECT
    v_used,
    v_limit,
    CASE WHEN v_limit IS NULL THEN NULL ELSE greatest(v_limit - v_used, 0) END,
    v_plan,
    v_period;
END;
$$;

REVOKE ALL ON FUNCTION public.get_analysis_quota() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_analysis_quota() TO authenticated;
