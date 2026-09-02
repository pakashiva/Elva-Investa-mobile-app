-- Partial withdrawal: reduce principal, reset interest accrual on new principal

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
    completed_interest_periods,
    total_earnings,
    tds_deducted_amount
  INTO inv
  FROM public.investments
  WHERE id = p_investment_id
    AND status = 'Active'
    AND invested_date IS NOT NULL
  FOR UPDATE;

  IF NOT FOUND THEN
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

CREATE OR REPLACE FUNCTION public.validate_withdrawal_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_principal NUMERIC(15, 2);
  v_total_earnings NUMERIC(15, 2);
  v_current_value NUMERIC(15, 2);
  v_full_amount NUMERIC(15, 2);
BEGIN
  SELECT fund_amount, total_earnings, current_value
  INTO v_principal, v_total_earnings, v_current_value
  FROM public.investments
  WHERE id = NEW.investment_id
    AND user_id = NEW.user_id
    AND status = 'Active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active investment not found for withdrawal.';
  END IF;

  IF NEW.strategy = 'partial' THEN
    IF NEW.withdrawal_amount <= 0 THEN
      RAISE EXCEPTION 'Withdrawal amount must be greater than zero.';
    END IF;

    IF NEW.withdrawal_amount >= v_principal THEN
      RAISE EXCEPTION 'Use full withdrawal to withdraw the entire principal.';
    END IF;

    IF (v_principal - NEW.withdrawal_amount) < 100000 THEN
      RAISE EXCEPTION 'Minimum remaining principal after partial withdrawal is ₹1,00,000.';
    END IF;
  ELSE
    v_full_amount := COALESCE(v_current_value, v_principal + COALESCE(v_total_earnings, 0));
    IF ABS(NEW.withdrawal_amount - v_full_amount) > 0.01 THEN
      RAISE EXCEPTION 'Full withdrawal amount must equal current investment value.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_withdrawal_request ON public.withdrawals;
CREATE TRIGGER trg_validate_withdrawal_request
  BEFORE INSERT ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_withdrawal_request();

CREATE OR REPLACE FUNCTION public.close_investment_on_withdrawal_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv RECORD;
  v_new_principal NUMERIC(15, 2);
BEGIN
  IF NEW.status = 'Approved'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.strategy = 'partial' THEN
      PERFORM public.process_investment_interest(NEW.investment_id);

      SELECT
        id,
        fund_amount,
        total_earnings
      INTO v_inv
      FROM public.investments
      WHERE id = NEW.investment_id
        AND status = 'Active'
      FOR UPDATE;

      IF NOT FOUND THEN
        RETURN NEW;
      END IF;

      v_new_principal := v_inv.fund_amount - NEW.withdrawal_amount;

      IF v_new_principal < 100000 THEN
        RAISE EXCEPTION 'Partial withdrawal would leave principal below minimum balance.';
      END IF;

      UPDATE public.investments
      SET
        fund_amount = v_new_principal,
        invested_date = CURRENT_DATE,
        completed_interest_periods = 0,
        current_value = v_new_principal + COALESCE(total_earnings, 0),
        updated_at = NOW()
      WHERE id = NEW.investment_id
        AND status = 'Active';
    ELSE
      UPDATE public.investments
      SET status = 'Closed', updated_at = NOW()
      WHERE id = NEW.investment_id
        AND status = 'Active';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
