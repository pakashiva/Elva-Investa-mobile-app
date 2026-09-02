-- Short-lived authorization after forgot-password OTP verification (used by edge function)

CREATE TABLE IF NOT EXISTS public.password_reset_authorizations (
  email text PRIMARY KEY,
  authorized_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_auth_expires
  ON public.password_reset_authorizations (authorized_until);

ALTER TABLE public.password_reset_authorizations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.password_reset_authorizations IS
  'Server-side only. Edge function stores authorization after OTP verify; completePasswordReset consumes it.';
