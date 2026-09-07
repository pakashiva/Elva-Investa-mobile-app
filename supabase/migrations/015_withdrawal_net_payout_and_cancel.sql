-- Set net_payout on create; allow users to cancel (DELETE) own Processing withdrawals

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

-- Backfill existing Processing rows with null net_payout
UPDATE public.withdrawals
SET net_payout = GREATEST(withdrawal_amount - 1550, 0)
WHERE net_payout IS NULL
  AND status = 'Processing';

DROP POLICY IF EXISTS "withdrawals_delete_own_processing" ON public.withdrawals;
CREATE POLICY "withdrawals_delete_own_processing"
  ON public.withdrawals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'Processing');
