-- OTP recovery helpers (Elvatech OTP is verified in the app; these RPCs handle DB/auth updates)

DROP TRIGGER IF EXISTS trg_protect_mobile_verified ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_mobile_verified_column();

CREATE OR REPLACE FUNCTION public.mark_mobile_verified()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles
  SET mobile_verified = TRUE,
      updated_at = NOW()
  WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_mobile_verified() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_recovery_mobile_by_email(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mobile text;
BEGIN
  SELECT mobile_number
  INTO mobile
  FROM public.profiles
  WHERE lower(trim(email_address)) = lower(trim(p_email))
  LIMIT 1;

  IF mobile IS NULL THEN
    RAISE EXCEPTION 'No account found for this email address.';
  END IF;

  RETURN mobile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_recovery_mobile_by_email(text) TO anon, authenticated;

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
  IF char_length(trim(p_new_password)) < 8 THEN
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
