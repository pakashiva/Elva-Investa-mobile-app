-- Investments and withdrawals for fund requests and withdrawal flow

CREATE SEQUENCE IF NOT EXISTS investment_code_seq START WITH 200;

CREATE OR REPLACE FUNCTION public.generate_investment_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('investment_code_seq');
  RETURN 'INV-' || lpad(next_val::text, 6, '0');
END;
$$;

CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE DEFAULT public.generate_investment_code(),
  name TEXT NOT NULL DEFAULT 'New Fund Request',
  detail_subtitle TEXT,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Active', 'Closed')),
  fund_amount NUMERIC(15, 2) NOT NULL,
  current_value NUMERIC(15, 2),
  yield_rate TEXT,
  earned_interest TEXT,
  tds_deducted TEXT,
  net_earned TEXT,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts (id),
  nominee_id UUID NOT NULL REFERENCES public.nominees (id),
  pay_date DATE NOT NULL,
  referral_code TEXT,
  agreement_charges NUMERIC(15, 2) NOT NULL DEFAULT 1550,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments (user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON public.investments (status);

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.investments (id),
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts (id),
  status TEXT NOT NULL DEFAULT 'Processing'
    CHECK (status IN ('Processing', 'Approved', 'Paid', 'Rejected')),
  withdrawal_amount NUMERIC(15, 2) NOT NULL,
  strategy TEXT NOT NULL DEFAULT 'full'
    CHECK (strategy IN ('full', 'partial')),
  requested_on DATE NOT NULL DEFAULT CURRENT_DATE,
  net_payout NUMERIC(15, 2),
  status_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals (user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_investment_id ON public.withdrawals (investment_id);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investments_select_own" ON public.investments;
CREATE POLICY "investments_select_own"
  ON public.investments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "investments_insert_own" ON public.investments;
CREATE POLICY "investments_insert_own"
  ON public.investments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "investments_update_own" ON public.investments;
CREATE POLICY "investments_update_own"
  ON public.investments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "withdrawals_select_own" ON public.withdrawals;
CREATE POLICY "withdrawals_select_own"
  ON public.withdrawals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "withdrawals_insert_own" ON public.withdrawals;
CREATE POLICY "withdrawals_insert_own"
  ON public.withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own bank_accounts and nominees (already exist)
-- Admin updates to investments/withdrawals use service role from admin portal

-- Close associated Active investment when withdrawal is Approved (admin-side update)
CREATE OR REPLACE FUNCTION public.close_investment_on_withdrawal_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Approved'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE public.investments
    SET status = 'Closed', updated_at = NOW()
    WHERE id = NEW.investment_id
      AND status = 'Active';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_withdrawal_approved_close_investment ON public.withdrawals;
CREATE TRIGGER trg_withdrawal_approved_close_investment
  AFTER INSERT OR UPDATE OF status ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.close_investment_on_withdrawal_approved();
