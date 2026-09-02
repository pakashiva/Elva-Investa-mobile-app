-- Investment interest accrual: numeric rate/TDS fields, period tracking, atomic RPC

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS invested_date DATE,
  ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(8, 6) NOT NULL DEFAULT 0.05,
  ADD COLUMN IF NOT EXISTS tds_percent NUMERIC(8, 6) NOT NULL DEFAULT 0.10,
  ADD COLUMN IF NOT EXISTS completed_interest_periods INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tds_deducted_amount NUMERIC(15, 2) NOT NULL DEFAULT 0;

-- Backfill invested_date for existing Active investments
UPDATE public.investments
SET invested_date = COALESCE(invested_date, pay_date, created_at::DATE)
WHERE status = 'Active'
  AND invested_date IS NULL;

-- Sync current_value for rows that have earnings
UPDATE public.investments
SET current_value = fund_amount + total_earnings
WHERE current_value IS NULL
   OR current_value = fund_amount;

COMMENT ON COLUMN public.investments.interest_rate IS 'Monthly simple interest rate as decimal (0.05 = 5% per month)';
COMMENT ON COLUMN public.investments.tds_percent IS 'TDS rate as decimal (0.10 = 10%)';
COMMENT ON COLUMN public.investments.completed_interest_periods IS 'Number of completed 30-day interest periods already credited';
COMMENT ON COLUMN public.investments.total_earnings IS 'Cumulative net earnings after TDS';
COMMENT ON COLUMN public.investments.tds_deducted_amount IS 'Cumulative TDS deducted';
COMMENT ON COLUMN public.investments.invested_date IS 'Date interest accrual begins (Active investments only)';

-- Atomically credit newly completed 30-day periods for the authenticated user
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
      completed_interest_periods,
      total_earnings,
      tds_deducted_amount
    FROM public.investments
    WHERE user_id = v_user_id
      AND status = 'Active'
      AND invested_date IS NOT NULL
    FOR UPDATE
  LOOP
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

REVOKE ALL ON FUNCTION public.process_user_investment_interest() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_user_investment_interest() TO authenticated;
