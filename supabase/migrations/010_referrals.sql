-- Referral system: codes, rewards, settings, investment attribution, transactions

-- ---------------------------------------------------------------------------
-- referral_settings (single-row configuration)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.referral_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  referral_rate NUMERIC(8, 6) NOT NULL DEFAULT 0.01,
  tds_rate NUMERIC(8, 6) NOT NULL DEFAULT 0.02,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.referral_settings (id, referral_rate, tds_rate)
VALUES (1, 0.01, 0.02)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_settings_select_authenticated" ON public.referral_settings;
CREATE POLICY "referral_settings_select_authenticated"
  ON public.referral_settings FOR SELECT
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- referral_codes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_codes_format CHECK (referral_code ~ '^[A-Z0-9]{8}$')
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes (referral_code);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_codes_select_own" ON public.referral_codes;
CREATE POLICY "referral_codes_select_own"
  ON public.referral_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- investments: add referrer_user_id
-- ---------------------------------------------------------------------------

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS referrer_user_id UUID REFERENCES auth.users (id);

CREATE INDEX IF NOT EXISTS idx_investments_referrer_user_id
  ON public.investments (referrer_user_id);

-- ---------------------------------------------------------------------------
-- referral_rewards
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  investment_id UUID NOT NULL UNIQUE REFERENCES public.investments (id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  capital_amount NUMERIC(15, 2) NOT NULL,
  referral_rate NUMERIC(8, 6) NOT NULL,
  gross_bonus NUMERIC(15, 2) NOT NULL,
  tds_rate NUMERIC(8, 6) NOT NULL,
  tds_amount NUMERIC(15, 2) NOT NULL,
  net_bonus NUMERIC(15, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'credited'
    CHECK (status IN ('credited')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer
  ON public.referral_rewards (referrer_user_id, created_at DESC);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_rewards_select_own" ON public.referral_rewards;
CREATE POLICY "referral_rewards_select_own"
  ON public.referral_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_user_id);

-- ---------------------------------------------------------------------------
-- Extend transactions for referral_bonus
-- ---------------------------------------------------------------------------

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_transaction_type_check
  CHECK (transaction_type IN ('instant_credit', 'withdrawal', 'referral_bonus'));

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_source_type_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_source_type_check
  CHECK (source_type IN ('investment', 'withdrawal', 'referral'));

-- ---------------------------------------------------------------------------
-- Referral code generation (server-side, 8-char uppercase alphanumeric)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  chars CONSTANT TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT;
  attempts INT := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, (floor(random() * 36) + 1)::INT, 1);
    END LOOP;

    IF NOT EXISTS (
      SELECT 1 FROM public.referral_codes WHERE referral_code = result
    ) THEN
      RETURN result;
    END IF;

    attempts := attempts + 1;
    IF attempts > 200 THEN
      RAISE EXCEPTION 'Could not generate a unique referral code.';
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_attempts INT := 0;
BEGIN
  SELECT referral_code
  INTO v_code
  FROM public.referral_codes
  WHERE user_id = p_user_id;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    v_code := public.generate_unique_referral_code();
    BEGIN
      INSERT INTO public.referral_codes (user_id, referral_code)
      VALUES (p_user_id, v_code);
      RETURN v_code;
    EXCEPTION
      WHEN unique_violation THEN
        SELECT referral_code
        INTO v_code
        FROM public.referral_codes
        WHERE user_id = p_user_id;

        IF v_code IS NOT NULL THEN
          RETURN v_code;
        END IF;

        v_attempts := v_attempts + 1;
        IF v_attempts > 200 THEN
          RAISE EXCEPTION 'Could not assign a referral code for user %.', p_user_id;
        END IF;
    END;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_ensure_referral_code_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_user_referral_code(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_ensure_referral_code ON public.profiles;
CREATE TRIGGER trg_profile_ensure_referral_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ensure_referral_code_on_profile();

-- Backfill referral codes for all existing auth users (idempotent)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM auth.users LOOP
    PERFORM public.ensure_user_referral_code(r.id);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Investment referral validation (server-side on insert)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_investment_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer UUID;
  v_normalized TEXT;
BEGIN
  NEW.referrer_user_id := NULL;

  IF NEW.referral_code IS NULL OR trim(NEW.referral_code) = '' THEN
    NEW.referral_code := NULL;
    RETURN NEW;
  END IF;

  v_normalized := upper(trim(NEW.referral_code));
  NEW.referral_code := v_normalized;

  IF v_normalized !~ '^[A-Z0-9]{8}$' THEN
    RAISE EXCEPTION 'Invalid referral code format.';
  END IF;

  SELECT user_id
  INTO v_referrer
  FROM public.referral_codes
  WHERE referral_code = v_normalized;

  IF v_referrer IS NULL THEN
    RAISE EXCEPTION 'Invalid referral code.';
  END IF;

  IF v_referrer = NEW.user_id THEN
    RAISE EXCEPTION 'You cannot use your own referral code.';
  END IF;

  NEW.referrer_user_id := v_referrer;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_investment_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.referral_code IS DISTINCT FROM NEW.referral_code
       OR OLD.referrer_user_id IS DISTINCT FROM NEW.referrer_user_id THEN
      RAISE EXCEPTION 'Referral attribution cannot be changed after investment creation.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_investment_referral ON public.investments;
CREATE TRIGGER trg_validate_investment_referral
  BEFORE INSERT ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_investment_referral();

DROP TRIGGER IF EXISTS trg_protect_investment_referral ON public.investments;
CREATE TRIGGER trg_protect_investment_referral
  BEFORE UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_investment_referral();

-- ---------------------------------------------------------------------------
-- Referral reward + transaction creation when investment becomes Active
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_referral_reward_on_investment_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_gross NUMERIC(15, 2);
  v_tds NUMERIC(15, 2);
  v_net NUMERIC(15, 2);
  v_reward_id UUID;
BEGIN
  IF NEW.status <> 'Active'
     OR NOT (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    RETURN NEW;
  END IF;

  IF NEW.referrer_user_id IS NULL OR NEW.referral_code IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.referrer_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.referral_rewards WHERE investment_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT referral_rate, tds_rate
  INTO v_settings
  FROM public.referral_settings
  WHERE id = 1;

  IF v_settings IS NULL THEN
    RAISE EXCEPTION 'Referral settings are not configured.';
  END IF;

  v_gross := round(NEW.fund_amount * v_settings.referral_rate, 2);
  v_tds := round(v_gross * v_settings.tds_rate, 2);
  v_net := round(v_gross - v_tds, 2);

  INSERT INTO public.referral_rewards (
    referrer_user_id,
    referred_user_id,
    investment_id,
    referral_code,
    capital_amount,
    referral_rate,
    gross_bonus,
    tds_rate,
    tds_amount,
    net_bonus,
    status
  )
  VALUES (
    NEW.referrer_user_id,
    NEW.user_id,
    NEW.id,
    NEW.referral_code,
    NEW.fund_amount,
    v_settings.referral_rate,
    v_gross,
    v_settings.tds_rate,
    v_tds,
    v_net,
    'credited'
  )
  ON CONFLICT (investment_id) DO NOTHING
  RETURNING id INTO v_reward_id;

  IF v_reward_id IS NULL THEN
    RETURN NEW;
  END IF;

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
    NEW.referrer_user_id,
    'referral_bonus',
    v_net,
    NEW.id,
    NEW.code,
    v_reward_id::TEXT,
    COALESCE(NEW.invested_date, NEW.pay_date, CURRENT_DATE),
    'referral',
    v_reward_id
  )
  ON CONFLICT (source_type, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_investment_active_referral_reward ON public.investments;
CREATE TRIGGER trg_investment_active_referral_reward
  AFTER INSERT OR UPDATE OF status ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_referral_reward_on_investment_active();

-- ---------------------------------------------------------------------------
-- RPC helpers for the mobile app
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN public.ensure_user_referral_code(auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized TEXT;
  v_referrer UUID;
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN TRUE;
  END IF;

  v_normalized := upper(trim(p_code));

  IF v_normalized !~ '^[A-Z0-9]{8}$' THEN
    RETURN FALSE;
  END IF;

  SELECT user_id
  INTO v_referrer
  FROM public.referral_codes
  WHERE referral_code = v_normalized;

  IF v_referrer IS NULL THEN
    RETURN FALSE;
  END IF;

  IF auth.uid() IS NOT NULL AND v_referrer = auth.uid() THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_referral_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total_referrals BIGINT;
  v_total_earnings NUMERIC(15, 2);
  v_pending_earnings NUMERIC(15, 2);
  v_referral_rate NUMERIC(8, 6);
  v_tds_rate NUMERIC(8, 6);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM public.ensure_user_referral_code(v_user_id);

  SELECT referral_rate, tds_rate
  INTO v_referral_rate, v_tds_rate
  FROM public.referral_settings
  WHERE id = 1;

  SELECT COUNT(DISTINCT referred_user_id)::BIGINT
  INTO v_total_referrals
  FROM public.referral_rewards
  WHERE referrer_user_id = v_user_id;

  SELECT COALESCE(SUM(net_bonus), 0)
  INTO v_total_earnings
  FROM public.referral_rewards
  WHERE referrer_user_id = v_user_id;

  SELECT COALESCE(
    SUM(
      round(
        i.fund_amount * v_referral_rate * (1 - v_tds_rate),
        2
      )
    ),
    0
  )
  INTO v_pending_earnings
  FROM public.investments i
  WHERE i.referrer_user_id = v_user_id
    AND i.status = 'Pending'
    AND NOT EXISTS (
      SELECT 1
      FROM public.referral_rewards rr
      WHERE rr.investment_id = i.id
    );

  RETURN json_build_object(
    'total_referrals', v_total_referrals,
    'total_earnings', v_total_earnings,
    'pending_earnings', v_pending_earnings,
    'referral_rate', v_referral_rate,
    'tds_rate', v_tds_rate
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_referral_history()
RETURNS TABLE (
  id UUID,
  referred_name TEXT,
  investment_code TEXT,
  capital_amount NUMERIC,
  net_bonus NUMERIC,
  referral_code TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    rr.id,
    p.full_name AS referred_name,
    i.code AS investment_code,
    rr.capital_amount,
    rr.net_bonus,
    rr.referral_code,
    rr.created_at
  FROM public.referral_rewards rr
  JOIN public.profiles p ON p.user_id = rr.referred_user_id
  LEFT JOIN public.investments i ON i.id = rr.investment_id
  WHERE rr.referrer_user_id = auth.uid()
  ORDER BY rr.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_referral_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_referral_history() TO authenticated;
