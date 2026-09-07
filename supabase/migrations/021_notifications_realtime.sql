-- Enable Realtime so the mobile app can show in-app toasts on INSERT.
-- Safe to re-run.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;

-- Helps Realtime deliver row data with RLS filters reliably.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
