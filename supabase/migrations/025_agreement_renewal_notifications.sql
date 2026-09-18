-- Additive: investor notifications when agreement renewals are Approved / Rejected.
-- Same pattern as investments / withdrawals (never notify on Pending).
--
-- SAFETY NOTES (Supabase may warn about DROP CONSTRAINT):
-- - The only DROP is on the CHECK constraint that limits notifications.kind values.
-- - It does NOT delete rows, tables, or columns.
-- - Required so kind = 'agreement_renewal' can be inserted.
-- - Re-run safe: skipped when the constraint already allows agreement_renewal.

-- ---------------------------------------------------------------------------
-- 1. Allow kind = agreement_renewal on notifications (expand CHECK only)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  constraint_name text;
  constraint_def text;
BEGIN
  SELECT con.conname, pg_get_constraintdef(con.oid)
  INTO constraint_name, constraint_def
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'notifications'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%kind%'
  LIMIT 1;

  -- Already expanded — nothing to do
  IF constraint_def ILIKE '%agreement_renewal%' THEN
    RETURN;
  END IF;

  IF constraint_name IS NOT NULL THEN
    -- Drops CHECK rule only (validation). No data removed.
    EXECUTE format(
      'ALTER TABLE public.notifications DROP CONSTRAINT %I',
      constraint_name
    );
  END IF;

  ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_kind_check
    CHECK (kind IN ('investment', 'withdrawal', 'agreement_renewal'));
END $$;

-- ---------------------------------------------------------------------------
-- 2. Trigger function (create / replace — no data impact)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_notify_agreement_renewal_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  amount_label text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND OLD.status = 'Pending'
     AND NEW.status IN ('Approved', 'Rejected') THEN

    IF NEW.mode = 'increase' AND NEW.increment_amount IS NOT NULL THEN
      amount_label :=
        'increase of ₹' || to_char(NEW.increment_amount, 'FM9999999990.00');
    ELSE
      amount_label :=
        'same amount ₹' || to_char(NEW.current_amount, 'FM9999999990.00');
    END IF;

    INSERT INTO public.notifications (
      user_id,
      kind,
      title,
      body,
      reference_id,
      decision
    ) VALUES (
      NEW.user_id,
      'agreement_renewal',
      CASE
        WHEN NEW.status = 'Approved' THEN 'Renewal approved'
        ELSE 'Renewal rejected'
      END,
      CASE
        WHEN NEW.status = 'Approved' THEN
          'Your renewal request for agreement ' || NEW.agreement_id ||
          ' (' || amount_label || ') has been approved.'
        ELSE
          'Your renewal request for agreement ' || NEW.agreement_id ||
          ' (' || amount_label || ') has been rejected.'
      END,
      NEW.id,
      CASE WHEN NEW.status = 'Approved' THEN 'approved' ELSE 'rejected' END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Attach trigger only if missing (no DROP TRIGGER)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace nsp ON nsp.oid = c.relnamespace
    WHERE t.tgname = 'trg_notify_agreement_renewal_decision'
      AND nsp.nspname = 'public'
      AND c.relname = 'agreement_renewal_requests'
      AND NOT t.tgisinternal
  ) THEN
    CREATE TRIGGER trg_notify_agreement_renewal_decision
      AFTER UPDATE OF status ON public.agreement_renewal_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_notify_agreement_renewal_decision();
  END IF;
END $$;

COMMENT ON FUNCTION public.trg_notify_agreement_renewal_decision() IS
  'Creates investor notification when agreement_renewal_requests status becomes Approved or Rejected.';
