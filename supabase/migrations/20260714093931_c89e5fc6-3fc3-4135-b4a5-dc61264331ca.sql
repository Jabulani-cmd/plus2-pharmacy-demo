DROP POLICY IF EXISTS "notif: mark own read" ON public.notifications;
DROP POLICY IF EXISTS "notif: read by audience" ON public.notifications;
DROP POLICY IF EXISTS "notif: scoped insert" ON public.notifications;
DROP POLICY IF EXISTS "open_notifications" ON public.notifications;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated;

CREATE POLICY "open_notifications"
  ON public.notifications
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);