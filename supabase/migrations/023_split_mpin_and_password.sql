-- Split MPIN from Auth password (shared DB; additive / safe for admin portal).
-- - set_own_mpin only updates profiles.mpin_hash (does NOT change auth password)
-- - complete_password_recovery restores normal password rules for Forgot Password
-- - complete_mpin_recovery updates MPIN only
-- - verify_own_mpin checks MPIN for unlock while session is active

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.set_own_mpin(p_mpin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_mpin IS NULL OR p_mpin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'MPIN must be exactly 4 digits.';
  END IF;

  UPDATE public.profiles
  SET
    mpin_hash = extensions.crypt(p_mpin, extensions.gen_salt('bf')),
    updated_at = NOW()
  WHERE user_id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found.';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_own_mpin(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_own_mpin(p_mpin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_hash text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  IF p_mpin IS NULL OR p_mpin !~ '^\d{4}$' THEN
    RETURN FALSE;
  END IF;

  SELECT mpin_hash INTO v_hash
  FROM public.profiles
  WHERE user_id = v_uid;

  IF v_hash IS NULL OR v_hash = '' THEN
    RETURN FALSE;
  END IF;

  RETURN extensions.crypt(p_mpin, v_hash) = v_hash;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_own_mpin(text) TO authenticated;

-- Forgot / change password (Auth password only)
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
BEGIN
  IF char_length(trim(coalesce(p_new_password, ''))) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters.';
  END IF;

  SELECT user_id
  INTO target_user_id
  FROM public.profiles
  WHERE lower(trim(email_address)) = lower(trim(p_email))
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No account found for this email address.';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_password_recovery(text, text) TO anon, authenticated;

-- Forgot / change MPIN (hash only; Auth password unchanged)
CREATE OR REPLACE FUNCTION public.complete_mpin_recovery(
  p_email text,
  p_new_mpin text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF p_new_mpin IS NULL OR p_new_mpin !~ '^\d{4}$' THEN
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

  UPDATE public.profiles
  SET
    mpin_hash = extensions.crypt(p_new_mpin, extensions.gen_salt('bf')),
    updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_mpin_recovery(text, text) TO anon, authenticated;
