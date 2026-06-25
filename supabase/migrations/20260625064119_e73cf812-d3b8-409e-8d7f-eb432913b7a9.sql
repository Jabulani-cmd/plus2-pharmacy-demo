
-- Lock SECURITY DEFINER helpers to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

-- Tighten notifications insert: only staff or a customer notifying themselves
DROP POLICY IF EXISTS "notif: insert any (server-side already validates)" ON public.notifications;
CREATE POLICY "notif: scoped insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff(auth.uid())
    OR (audience = 'customer' AND user_id = auth.uid())
    OR (audience = 'driver' AND user_id = auth.uid())
  );
