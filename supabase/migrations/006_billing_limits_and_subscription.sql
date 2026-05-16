-- Billing plan limits (single source of truth)
CREATE TABLE IF NOT EXISTS public.billing_plan_limits (
  plan_code TEXT PRIMARY KEY,
  analysis_limit_monthly INTEGER NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.billing_plan_limits (plan_code, analysis_limit_monthly)
VALUES
  ('free', 3),
  ('pro', NULL)
ON CONFLICT (plan_code) DO UPDATE
SET analysis_limit_monthly = EXCLUDED.analysis_limit_monthly,
    updated_at = now();

-- User subscription state
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL DEFAULT 'free' REFERENCES public.billing_plan_limits(plan_code),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled')),
  provider TEXT NULL,
  provider_subscription_id TEXT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_plan ON public.billing_subscriptions(plan_code);

-- Monthly usage for analysis requests
CREATE TABLE IF NOT EXISTS public.usage_analytics_monthly (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_yyyymm INTEGER NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  limit_count INTEGER NULL,
  plan_code TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period_yyyymm)
);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_period ON public.usage_analytics_monthly(period_yyyymm);

-- Optional table for tracing YooKassa webhooks
CREATE TABLE IF NOT EXISTS public.billing_payment_events (
  payment_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (payment_id, event_name)
);

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_billing_plan_limits_updated_at ON public.billing_plan_limits;
CREATE TRIGGER trg_billing_plan_limits_updated_at
BEFORE UPDATE ON public.billing_plan_limits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_billing_subscriptions_updated_at ON public.billing_subscriptions;
CREATE TRIGGER trg_billing_subscriptions_updated_at
BEFORE UPDATE ON public.billing_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_usage_analytics_monthly_updated_at ON public.usage_analytics_monthly;
CREATE TRIGGER trg_usage_analytics_monthly_updated_at
BEFORE UPDATE ON public.usage_analytics_monthly
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.billing_plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_plan_limits_select_auth" ON public.billing_plan_limits;
CREATE POLICY "billing_plan_limits_select_auth"
ON public.billing_plan_limits
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "billing_subscriptions_select_own" ON public.billing_subscriptions;
CREATE POLICY "billing_subscriptions_select_own"
ON public.billing_subscriptions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usage_analytics_select_own" ON public.usage_analytics_monthly;
CREATE POLICY "usage_analytics_select_own"
ON public.usage_analytics_monthly
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "billing_payment_events_service_only" ON public.billing_payment_events;
CREATE POLICY "billing_payment_events_service_only"
ON public.billing_payment_events
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

-- Atomically consume one analysis credit
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
    UPDATE public.usage_analytics_monthly
      SET used_count = used_count + 1
    WHERE user_id = v_user_id
      AND period_yyyymm = v_period
    RETURNING usage_analytics_monthly.used_count INTO v_used;

    RETURN QUERY
    SELECT true, v_used, NULL::INTEGER, NULL::INTEGER, v_plan, v_period;
    RETURN;
  END IF;

  UPDATE public.usage_analytics_monthly
     SET used_count = used_count + 1
   WHERE user_id = v_user_id
     AND period_yyyymm = v_period
     AND used_count < v_limit
  RETURNING usage_analytics_monthly.used_count INTO v_used;

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

-- Quota stats for UI (without consuming)
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

  SELECT analysis_limit_monthly
    INTO v_limit
  FROM public.billing_plan_limits
  WHERE plan_code = v_plan;

  IF NOT FOUND THEN
    v_plan := 'free';
    SELECT analysis_limit_monthly
      INTO v_limit
    FROM public.billing_plan_limits
    WHERE plan_code = 'free';
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
