-- Interest / TDS accrual requires BOTH:
--   1) CURRENT_DATE - invested_date >= 30
--   2) CURRENT_DATE >= pay_date
-- Safe for admin portal: replaces shared interest RPCs only.

CREATE OR REPLACE FUNCTION public.process_user_investment_interest()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  inv RECORD;
  v_days INTEGER;
  v_completed_periods INTEGER;
  v_new_periods INTEGER;
  v_monthly_interest NUMERIC(15, 2);
  v_monthly_tds NUMERIC(15, 2);
  v_monthly_net NUMERIC(15, 2);
  v_updated_count INTEGER := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR inv IN
    SELECT
      id,
      fund_amount,
      interest_rate,
      tds_percent,
      invested_date,
      pay_date,
      completed_interest_periods,
      total_earnings,
      tds_deducted_amount
    FROM public.investments
    WHERE user_id = v_user_id
      AND status = 'Active'
      AND invested_date IS NOT NULL
      AND pay_date IS NOT NULL
    FOR UPDATE
  LOOP
    IF CURRENT_DATE < inv.pay_date THEN
      CONTINUE;
    END IF;

    v_days := CURRENT_DATE - inv.invested_date;

    IF v_days < 30 THEN
      CONTINUE;
    END IF;

    v_completed_periods := v_days / 30;
    v_new_periods := v_completed_periods - inv.completed_interest_periods;

    IF v_new_periods <= 0 THEN
      CONTINUE;
    END IF;

    v_monthly_interest := ROUND(inv.fund_amount * inv.interest_rate, 2);
    v_monthly_tds := ROUND(v_monthly_interest * inv.tds_percent, 2);
    v_monthly_net := v_monthly_interest - v_monthly_tds;

    UPDATE public.investments
    SET
      completed_interest_periods = v_completed_periods,
      tds_deducted_amount = inv.tds_deducted_amount + (v_monthly_tds * v_new_periods),
      total_earnings = inv.total_earnings + (v_monthly_net * v_new_periods),
      current_value = inv.fund_amount + inv.total_earnings + (v_monthly_net * v_new_periods),
      updated_at = NOW()
    WHERE id = inv.id
      AND user_id = v_user_id
      AND completed_interest_periods = inv.completed_interest_periods;

    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;

  RETURN v_updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_investment_interest(p_investment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  v_days INTEGER;
  v_completed_periods INTEGER;
  v_new_periods INTEGER;
  v_monthly_interest NUMERIC(15, 2);
  v_monthly_tds NUMERIC(15, 2);
  v_monthly_net NUMERIC(15, 2);
BEGIN
  SELECT
    id,
    fund_amount,
    interest_rate,
    tds_percent,
    invested_date,
    pay_date,
    completed_interest_periods,
    total_earnings,
    tds_deducted_amount
  INTO inv
  FROM public.investments
  WHERE id = p_investment_id
    AND status = 'Active'
    AND invested_date IS NOT NULL
    AND pay_date IS NOT NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF CURRENT_DATE < inv.pay_date THEN
    RETURN;
  END IF;

  v_days := CURRENT_DATE - inv.invested_date;

  IF v_days < 30 THEN
    RETURN;
  END IF;

  v_completed_periods := v_days / 30;
  v_new_periods := v_completed_periods - inv.completed_interest_periods;

  IF v_new_periods <= 0 THEN
    RETURN;
  END IF;

  v_monthly_interest := ROUND(inv.fund_amount * inv.interest_rate, 2);
  v_monthly_tds := ROUND(v_monthly_interest * inv.tds_percent, 2);
  v_monthly_net := v_monthly_interest - v_monthly_tds;

  UPDATE public.investments
  SET
    completed_interest_periods = v_completed_periods,
    tds_deducted_amount = inv.tds_deducted_amount + (v_monthly_tds * v_new_periods),
    total_earnings = inv.total_earnings + (v_monthly_net * v_new_periods),
    current_value = inv.fund_amount + inv.total_earnings + (v_monthly_net * v_new_periods),
    updated_at = NOW()
  WHERE id = inv.id
    AND completed_interest_periods = inv.completed_interest_periods;
END;
$$;

COMMENT ON FUNCTION public.process_user_investment_interest() IS
  'Credits completed 30-day interest periods only when CURRENT_DATE >= pay_date and days since invested_date >= 30';
