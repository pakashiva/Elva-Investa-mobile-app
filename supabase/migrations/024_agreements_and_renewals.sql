-- New table only: stores renewal requests submitted from the Agreements screen.
-- Does not alter investments, customers, or any other existing tables/triggers.
-- Safe / additive for admin portal (admin can SELECT this table later).

CREATE TABLE IF NOT EXISTS public.agreement_renewal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Investment this agreement belongs to (approved fund request)
  investment_id UUID NOT NULL REFERENCES public.investments (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- Display / admin fields
  agreement_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  current_amount NUMERIC(14, 2) NOT NULL,
  -- Extra principal requested when mode = increase (null for same_amount)
  increment_amount NUMERIC(14, 2) NULL,
  mode TEXT NOT NULL CHECK (mode IN ('same_amount', 'increase')),
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agreement_renewal_requests_user_id
  ON public.agreement_renewal_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_agreement_renewal_requests_status
  ON public.agreement_renewal_requests (status);

CREATE INDEX IF NOT EXISTS idx_agreement_renewal_requests_investment_id
  ON public.agreement_renewal_requests (investment_id);

ALTER TABLE public.agreement_renewal_requests ENABLE ROW LEVEL SECURITY;

-- Policies created only if missing (no DROP statements)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agreement_renewal_requests'
      AND policyname = 'agreement_renewal_requests_select_own'
  ) THEN
    CREATE POLICY "agreement_renewal_requests_select_own"
      ON public.agreement_renewal_requests FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agreement_renewal_requests'
      AND policyname = 'agreement_renewal_requests_insert_own'
  ) THEN
    CREATE POLICY "agreement_renewal_requests_insert_own"
      ON public.agreement_renewal_requests FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE public.agreement_renewal_requests IS
  'Investor renewal requests from Agreements screen. mode: same_amount | increase. Admin portal can fetch Pending rows.';
