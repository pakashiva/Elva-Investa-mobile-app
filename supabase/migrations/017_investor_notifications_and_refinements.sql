-- Investor notifications + nominee_percentage removal + agreement charge 1000
-- Safe for admin portal: does not alter admin_* tables/RPCs

-- ---------------------------------------------------------------------------
-- 1. Drop nominee_percentage (unused by admin customer RPCs)
-- ---------------------------------------------------------------------------
ALTER TABLE public.nominees
  DROP COLUMN IF EXISTS nominee_percentage;

-- ---------------------------------------------------------------------------
-- 2. Agreement charges default 1000; net_payout rules
--    full  => amount - 1000
--    partial => amount (no charge)
-- ---------------------------------------------------------------------------
ALTER TABLE public.investments
  ALTER COLUMN agreement_charges SET DEFAULT 1000;

CREATE OR REPLACE FUNCTION public.set_withdrawal_net_payout_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(COALESCE(NEW.strategy, 'full')) = 'partial' THEN
    NEW.net_payout := GREATEST(NEW.withdrawal_amount, 0);
  ELSE
    NEW.net_payout := GREATEST(NEW.withdrawal_amount - 1000, 0);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_withdrawal_set_net_payout ON public.withdrawals;
CREATE TRIGGER trg_withdrawal_set_net_payout
  BEFORE INSERT ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_withdrawal_net_payout_on_insert();

UPDATE public.withdrawals w
SET net_payout = CASE
  WHEN lower(COALESCE(w.strategy, 'full')) = 'partial'
    THEN GREATEST(w.withdrawal_amount, 0)
  ELSE GREATEST(w.withdrawal_amount - 1000, 0)
END
WHERE w.status IN ('Processing', 'On Hold');

-- ---------------------------------------------------------------------------
-- 3. Investor notifications (approve/reject only — never pending)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('investment', 'withdrawal')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  reference_id UUID,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id)
  WHERE is_read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.trg_notify_investment_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND OLD.status IN ('Pending', 'Under Review')
     AND NEW.status IN ('Active', 'Rejected') THEN
    INSERT INTO public.notifications (
      user_id,
      kind,
      title,
      body,
      reference_id,
      decision
    ) VALUES (
      NEW.user_id,
      'investment',
      CASE
        WHEN NEW.status = 'Active' THEN 'Investment approved'
        ELSE 'Investment rejected'
      END,
      CASE
        WHEN NEW.status = 'Active' THEN
          'Your fund request "' || COALESCE(NEW.name, NEW.code) ||
          '" for ₹' || to_char(NEW.fund_amount, 'FM9999999990.00') ||
          ' has been approved.'
        ELSE
          'Your fund request "' || COALESCE(NEW.name, NEW.code) ||
          '" for ₹' || to_char(NEW.fund_amount, 'FM9999999990.00') ||
          ' has been rejected.'
      END,
      NEW.id,
      CASE WHEN NEW.status = 'Active' THEN 'approved' ELSE 'rejected' END
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_investment_decision ON public.investments;
CREATE TRIGGER trg_notify_investment_decision
  AFTER UPDATE OF status ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_investment_decision();

CREATE OR REPLACE FUNCTION public.trg_notify_withdrawal_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND OLD.status IN ('Processing', 'On Hold')
     AND NEW.status IN ('Approved', 'Rejected') THEN
    INSERT INTO public.notifications (
      user_id,
      kind,
      title,
      body,
      reference_id,
      decision
    ) VALUES (
      NEW.user_id,
      'withdrawal',
      CASE
        WHEN NEW.status = 'Approved' THEN 'Withdrawal approved'
        ELSE 'Withdrawal rejected'
      END,
      CASE
        WHEN NEW.status = 'Approved' THEN
          'Your withdrawal request for ₹' ||
          to_char(NEW.withdrawal_amount, 'FM9999999990.00') ||
          ' has been approved.'
        ELSE
          'Your withdrawal request for ₹' ||
          to_char(NEW.withdrawal_amount, 'FM9999999990.00') ||
          ' has been rejected.'
      END,
      NEW.id,
      CASE WHEN NEW.status = 'Approved' THEN 'approved' ELSE 'rejected' END
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_withdrawal_decision ON public.withdrawals;
CREATE TRIGGER trg_notify_withdrawal_decision
  AFTER UPDATE OF status ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_withdrawal_decision();
