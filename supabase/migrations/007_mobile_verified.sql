-- Mobile OTP verification flag on profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Profiles created before OTP enforcement are treated as already verified.
UPDATE public.profiles
SET mobile_verified = TRUE
WHERE mobile_verified = FALSE;

CREATE OR REPLACE FUNCTION public.protect_mobile_verified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.mobile_verified IS TRUE
     AND (OLD.mobile_verified IS DISTINCT FROM NEW.mobile_verified)
     AND auth.role() = 'authenticated' THEN
    RAISE EXCEPTION 'mobile_verified cannot be updated directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_mobile_verified ON public.profiles;
CREATE TRIGGER trg_protect_mobile_verified
  BEFORE UPDATE OF mobile_verified ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_mobile_verified_column();
