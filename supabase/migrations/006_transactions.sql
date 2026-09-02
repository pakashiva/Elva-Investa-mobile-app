-- Transactions ledger + auto-creation on investment Active / withdrawal Paid

CREATE SEQUENCE IF NOT EXISTS transaction_code_seq START WITH 894721;

CREATE OR REPLACE FUNCTION public.generate_transaction_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('transaction_code_seq');
  RETURN 'TXN-' || lpad(next_val::text, 6, '0');
END;
$$;

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  transaction_code TEXT NOT NULL UNIQUE DEFAULT public.generate_transaction_code(),
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('instant_credit', 'withdrawal')),
  amount NUMERIC(15, 2) NOT NULL,
  investment_id UUID REFERENCES public.investments (id),
  investment_plan_id TEXT NOT NULL,
  reference_id TEXT,
  transaction_date DATE NOT NULL,
  source_type TEXT NOT NULL
    CHECK (source_type IN ('investment', 'withdrawal')),
  source_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transactions_source_unique UNIQUE (source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON public.transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_investment_id ON public.transactions (investment_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for authenticated users.
-- Transactions are created by SECURITY DEFINER trigger functions only.

CREATE OR REPLACE FUNCTION public.create_investment_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Active'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.transactions (
      user_id,
      transaction_type,
      amount,
      investment_id,
      investment_plan_id,
      reference_id,
      transaction_date,
      source_type,
      source_id
    )
    VALUES (
      NEW.user_id,
      'instant_credit',
      NEW.fund_amount,
      NEW.id,
      NEW.code,
      NULL,
      COALESCE(NEW.invested_date, NEW.pay_date, CURRENT_DATE),
      'investment',
      NEW.id
    )
    ON CONFLICT (source_type, source_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_withdrawal_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_code TEXT;
BEGIN
  IF NEW.status = 'Paid'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT code INTO plan_code
    FROM public.investments
    WHERE id = NEW.investment_id;

    INSERT INTO public.transactions (
      user_id,
      transaction_type,
      amount,
      investment_id,
      investment_plan_id,
      reference_id,
      transaction_date,
      source_type,
      source_id
    )
    VALUES (
      NEW.user_id,
      'withdrawal',
      COALESCE(NEW.net_payout, NEW.withdrawal_amount),
      NEW.investment_id,
      COALESCE(plan_code, '—'),
      NULL,
      COALESCE(NEW.requested_on, (NEW.status_date AT TIME ZONE 'UTC')::DATE, CURRENT_DATE),
      'withdrawal',
      NEW.id
    )
    ON CONFLICT (source_type, source_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_investment_active_transaction ON public.investments;
CREATE TRIGGER trg_investment_active_transaction
  AFTER INSERT OR UPDATE OF status ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_investment_transaction();

DROP TRIGGER IF EXISTS trg_withdrawal_paid_transaction ON public.withdrawals;
CREATE TRIGGER trg_withdrawal_paid_transaction
  AFTER INSERT OR UPDATE OF status ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.create_withdrawal_transaction();

-- Backfill transactions for existing Active investments and Paid withdrawals
INSERT INTO public.transactions (
  user_id,
  transaction_type,
  amount,
  investment_id,
  investment_plan_id,
  reference_id,
  transaction_date,
  source_type,
  source_id
)
SELECT
  i.user_id,
  'instant_credit',
  i.fund_amount,
  i.id,
  i.code,
  NULL,
  COALESCE(i.invested_date, i.pay_date, i.created_at::DATE),
  'investment',
  i.id
FROM public.investments i
WHERE i.status = 'Active'
ON CONFLICT (source_type, source_id) DO NOTHING;

INSERT INTO public.transactions (
  user_id,
  transaction_type,
  amount,
  investment_id,
  investment_plan_id,
  reference_id,
  transaction_date,
  source_type,
  source_id
)
SELECT
  w.user_id,
  'withdrawal',
  COALESCE(w.net_payout, w.withdrawal_amount),
  w.investment_id,
  COALESCE(i.code, '—'),
  NULL,
  COALESCE(w.requested_on, w.status_date::DATE, w.created_at::DATE),
  'withdrawal',
  w.id
FROM public.withdrawals w
LEFT JOIN public.investments i ON i.id = w.investment_id
WHERE w.status = 'Paid'
ON CONFLICT (source_type, source_id) DO NOTHING;
