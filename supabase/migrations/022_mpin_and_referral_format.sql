-- MPIN + referral format (shared Supabase with admin portal)
-- SAFE / ADDITIVE:
--   - Adds profiles.mpin_hash (nullable); does not touch admin_* tables/RPCs
--   - New referral codes use 6 digits + name; legacy 8-char codes stay valid
--   - Does NOT rewrite existing referral_codes (admin history / displays stay stable)
--   - complete_password_recovery tightened for mobile MPIN only (admin login unused)

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- 1. MPIN on profiles
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mpin_hash TEXT;

CREATE OR REPLACE FUNCTION public.set_own_mpin(p_mpin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_hash text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_mpin IS NULL OR p_mpin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'MPIN must be exactly 4 digits.';
  END IF;

  -- Auth requires longer secrets than 4 chars; derive a stable password from MPIN.
  v_hash := extensions.crypt('vt1-' || p_mpin, extensions.gen_salt('bf'));

  UPDATE auth.users
  SET
    encrypted_password = v_hash,
    updated_at = NOW()
  WHERE id = v_uid;

  UPDATE public.profiles
  SET
    mpin_hash = v_hash,
    updated_at = NOW()
  WHERE user_id = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_own_mpin(text) TO authenticated;

-- Mobile app Forgot/Change MPIN (admin portal does not call this).
CREATE OR REPLACE FUNCTION public.complete_password_recovery(
  p_email text,
  p_new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, extensions
AS $$
DECLARE
  target_user_id uuid;
  v_hash text;
BEGIN
  IF p_new_password IS NULL OR p_new_password !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'MPIN must be exactly 4 digits.';
  END IF;

  SELECT user_id
  INTO target_user_id
  FROM public.profiles
  WHERE lower(trim(email_address)) = lower(trim(p_email))
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No account found for this email address.';
  END IF;

  v_hash := extensions.crypt('vt1-' || p_new_password, extensions.gen_salt('bf'));

  UPDATE auth.users
  SET
    encrypted_password = v_hash,
    updated_at = NOW()
  WHERE id = target_user_id;

  UPDATE public.profiles
  SET
    mpin_hash = v_hash,
    updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_password_recovery(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_login_email_by_mobile(p_mobile text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_digits text;
BEGIN
  v_digits := regexp_replace(coalesce(p_mobile, ''), '\D', '', 'g');
  IF char_length(v_digits) > 10 THEN
    v_digits := right(v_digits, 10);
  END IF;

  IF v_digits IS NULL OR char_length(v_digits) < 10 THEN
    RAISE EXCEPTION 'Enter a valid 10-digit mobile number.';
  END IF;

  SELECT email_address
  INTO v_email
  FROM public.profiles
  WHERE regexp_replace(mobile_number, '\D', '', 'g') LIKE '%' || v_digits
  LIMIT 1;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'No account found for this mobile number.';
  END IF;

  RETURN lower(trim(v_email));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_login_email_by_mobile(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Referral format: new codes = 6 digits + name; keep legacy 8-char
-- ---------------------------------------------------------------------------

ALTER TABLE public.referral_codes
  DROP CONSTRAINT IF EXISTS referral_codes_format;

ALTER TABLE public.referral_codes
  ADD CONSTRAINT referral_codes_format
  CHECK (
    referral_code ~ '^[0-9]{6}[a-z0-9]+$'
    OR referral_code ~ '^[A-Z0-9]{8}$'
  );

CREATE OR REPLACE FUNCTION public.sanitize_referral_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    lower(regexp_replace(coalesce(p_name, ''), '[^A-Za-z0-9]', '', 'g')),
    ''
  );
$$;

-- Optional p_user_id keeps zero-arg calls working (DEFAULT NULL).
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code(p_user_id uuid DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_name text;
  v_digits text;
  result text;
  attempts int := 0;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT public.sanitize_referral_name(full_name)
    INTO v_name
    FROM public.profiles
    WHERE user_id = p_user_id;
  END IF;

  IF v_name IS NULL OR v_name = '' THEN
    v_name := 'user';
  END IF;

  LOOP
    v_digits := lpad((floor(random() * 1000000))::int::text, 6, '0');
    result := v_digits || v_name;

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

  -- Keep existing codes (including legacy 8-char) unchanged for admin stability.
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    v_code := public.generate_unique_referral_code(p_user_id);
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

CREATE OR REPLACE FUNCTION public.normalize_referral_code_input(p_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(trim(coalesce(p_code, '')), '\s', '', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.is_valid_referral_code_format(p_code text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_code ~ '^[0-9]{6}[a-z0-9]+$'
    OR upper(p_code) ~ '^[A-Z0-9]{8}$';
$$;

CREATE OR REPLACE FUNCTION public.validate_investment_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer UUID;
  v_normalized TEXT;
  v_lookup TEXT;
BEGIN
  NEW.referrer_user_id := NULL;

  IF NEW.referral_code IS NULL OR trim(NEW.referral_code) = '' THEN
    NEW.referral_code := NULL;
    RETURN NEW;
  END IF;

  v_normalized := public.normalize_referral_code_input(NEW.referral_code);

  IF NOT public.is_valid_referral_code_format(v_normalized) THEN
    RAISE EXCEPTION 'Invalid referral code format.';
  END IF;

  SELECT user_id, referral_code
  INTO v_referrer, v_lookup
  FROM public.referral_codes
  WHERE referral_code = v_normalized
     OR referral_code = upper(v_normalized)
  LIMIT 1;

  IF v_referrer IS NULL THEN
    RAISE EXCEPTION 'Invalid referral code.';
  END IF;

  IF v_referrer = NEW.user_id THEN
    RAISE EXCEPTION 'You cannot use your own referral code.';
  END IF;

  NEW.referral_code := v_lookup;
  NEW.referrer_user_id := v_referrer;
  RETURN NEW;
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

  v_normalized := public.normalize_referral_code_input(p_code);

  IF NOT public.is_valid_referral_code_format(v_normalized) THEN
    RETURN FALSE;
  END IF;

  SELECT user_id
  INTO v_referrer
  FROM public.referral_codes
  WHERE referral_code = v_normalized
     OR referral_code = upper(v_normalized)
  LIMIT 1;

  IF v_referrer IS NULL THEN
    RETURN FALSE;
  END IF;

  IF auth.uid() IS NOT NULL AND v_referrer = auth.uid() THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.lookup_referral_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized TEXT;
  v_referrer UUID;
  v_stored TEXT;
  v_name TEXT;
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN json_build_object('valid', true, 'referrer_name', null, 'referral_code', null);
  END IF;

  v_normalized := public.normalize_referral_code_input(p_code);

  IF NOT public.is_valid_referral_code_format(v_normalized) THEN
    RETURN json_build_object('valid', false, 'referrer_name', null, 'referral_code', null);
  END IF;

  SELECT rc.user_id, rc.referral_code, p.full_name
  INTO v_referrer, v_stored, v_name
  FROM public.referral_codes rc
  JOIN public.profiles p ON p.user_id = rc.user_id
  WHERE rc.referral_code = v_normalized
     OR rc.referral_code = upper(v_normalized)
  LIMIT 1;

  IF v_referrer IS NULL THEN
    RETURN json_build_object('valid', false, 'referrer_name', null, 'referral_code', null);
  END IF;

  IF auth.uid() IS NOT NULL AND v_referrer = auth.uid() THEN
    RETURN json_build_object('valid', false, 'referrer_name', null, 'referral_code', null);
  END IF;

  RETURN json_build_object(
    'valid', true,
    'referrer_name', coalesce(nullif(trim(v_name), ''), 'Referrer'),
    'referral_code', v_stored
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_referral_code(TEXT) TO authenticated;
