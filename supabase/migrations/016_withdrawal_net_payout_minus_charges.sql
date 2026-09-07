-- Net payout = withdrawal_amount - 1550 (agreement charge)

CREATE OR REPLACE FUNCTION public.set_withdrawal_net_payout_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.net_payout := GREATEST(NEW.withdrawal_amount - 1550, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_withdrawal_set_net_payout ON public.withdrawals;
CREATE TRIGGER trg_withdrawal_set_net_payout
  BEFORE INSERT ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_withdrawal_net_payout_on_insert();

-- Recalculate Processing net payouts that were stored as full requested amount
UPDATE public.withdrawals
SET net_payout = GREATEST(withdrawal_amount - 1550, 0)
WHERE status = 'Processing';
