-- Assign customer IDs (CUST-01…) and 10-char request IDs for investments/withdrawals.
-- Safe for admin portal: fills the nullable columns admin already reads.
-- Does not alter admin_* RPCs/tables.

-- ---------------------------------------------------------------------------
-- 1. Customers table + CUST-01, CUST-02, …
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS customer_id_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_customer_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('customer_id_seq');
  RETURN 'CUST-' || lpad(next_val::text, 2, '0');
END;
$$;

CREATE TABLE IF NOT EXISTS public.customers (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS customer_id TEXT;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS customers_customer_id_unique
  ON public.customers (customer_id)
  WHERE customer_id IS NOT NULL;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_select_own" ON public.customers;
CREATE POLICY "customers_select_own"
  ON public.customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Sync sequence with highest existing CUST-N (supports CUST-01 and CUST-0001)
DO $$
DECLARE
  v_max BIGINT;
BEGIN
  SELECT COALESCE(
    MAX(
      NULLIF(
        regexp_replace(customer_id, '^CUST-0*', ''),
        ''
      )::BIGINT
    ),
    0
  )
  INTO v_max
  FROM public.customers
  WHERE customer_id ~ '^CUST-[0-9]+$';

  PERFORM setval(
    'public.customer_id_seq',
    GREATEST(v_max, 1),
    v_max > 0
  );
END $$;

CREATE OR REPLACE FUNCTION public.ensure_customer_for_user(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id TEXT;
BEGIN
  SELECT customer_id
  INTO v_customer_id
  FROM public.customers
  WHERE user_id = p_user_id;

  IF FOUND THEN
    IF v_customer_id IS NOT NULL AND length(trim(v_customer_id)) > 0 THEN
      RETURN v_customer_id;
    END IF;

    UPDATE public.customers
    SET
      customer_id = public.generate_customer_id(),
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING customer_id INTO v_customer_id;

    RETURN v_customer_id;
  END IF;

  INSERT INTO public.customers (user_id, customer_id)
  VALUES (p_user_id, public.generate_customer_id())
  ON CONFLICT (user_id) DO UPDATE
    SET customer_id = COALESCE(
      public.customers.customer_id,
      EXCLUDED.customer_id
    ),
    updated_at = NOW()
  RETURNING customer_id INTO v_customer_id;

  RETURN v_customer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_ensure_customer_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_customer_for_user(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_ensure_customer ON public.profiles;
CREATE TRIGGER trg_profile_ensure_customer
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ensure_customer_on_profile();

-- Ensure every profile has a customers row, then assign missing IDs
INSERT INTO public.customers (user_id)
SELECT p.user_id
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.customers c WHERE c.user_id = p.user_id
)
ON CONFLICT (user_id) DO NOTHING;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT user_id
    FROM public.customers
    WHERE customer_id IS NULL OR trim(customer_id) = ''
    ORDER BY created_at ASC NULLS LAST, user_id ASC
  LOOP
    PERFORM public.ensure_customer_for_user(r.user_id);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Unique 10-character request IDs (investments + withdrawals)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_request_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT;
  i INTEGER;
  attempts INTEGER := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..10 LOOP
      result := result || substr(
        alphabet,
        1 + floor(random() * length(alphabet))::INTEGER,
        1
      );
    END LOOP;

    IF NOT EXISTS (
      SELECT 1 FROM public.investments WHERE request_id = result
    ) AND NOT EXISTS (
      SELECT 1 FROM public.withdrawals WHERE request_id = result
    ) THEN
      RETURN result;
    END IF;

    attempts := attempts + 1;
    IF attempts > 40 THEN
      RAISE EXCEPTION 'Could not generate a unique 10-character request id.';
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS request_id TEXT;

ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS request_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS investments_request_id_unique
  ON public.investments (request_id)
  WHERE request_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS withdrawals_request_id_unique
  ON public.withdrawals (request_id)
  WHERE request_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.trg_set_investment_request_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.request_id IS NULL OR trim(NEW.request_id) = '' THEN
    NEW.request_id := public.generate_request_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_set_withdrawal_request_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.request_id IS NULL OR trim(NEW.request_id) = '' THEN
    NEW.request_id := public.generate_request_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_investment_set_request_id ON public.investments;
CREATE TRIGGER trg_investment_set_request_id
  BEFORE INSERT ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_set_investment_request_id();

DROP TRIGGER IF EXISTS trg_withdrawal_set_request_id ON public.withdrawals;
CREATE TRIGGER trg_withdrawal_set_request_id
  BEFORE INSERT ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_set_withdrawal_request_id();

-- Backfill existing rows that still show as "-" in admin
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id
    FROM public.investments
    WHERE request_id IS NULL OR trim(request_id) = ''
    ORDER BY created_at ASC
  LOOP
    UPDATE public.investments
    SET request_id = public.generate_request_id()
    WHERE id = r.id;
  END LOOP;

  FOR r IN
    SELECT id
    FROM public.withdrawals
    WHERE request_id IS NULL OR trim(request_id) = ''
    ORDER BY created_at ASC
  LOOP
    UPDATE public.withdrawals
    SET request_id = public.generate_request_id()
    WHERE id = r.id;
  END LOOP;
END $$;

-- Keep withdrawal `code` populated for mobile display (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'withdrawals'
      AND column_name = 'code'
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS withdrawal_code_seq START WITH 1;

    CREATE OR REPLACE FUNCTION public.generate_withdrawal_code()
    RETURNS TEXT
    LANGUAGE plpgsql
    AS $fn$
    DECLARE
      next_val BIGINT;
    BEGIN
      next_val := nextval('withdrawal_code_seq');
      RETURN 'WDR-' || lpad(next_val::text, 6, '0');
    END;
    $fn$;

    UPDATE public.withdrawals
    SET code = public.generate_withdrawal_code()
    WHERE code IS NULL OR trim(code) = '';

    ALTER TABLE public.withdrawals
      ALTER COLUMN code SET DEFAULT public.generate_withdrawal_code();
  END IF;
END $$;
