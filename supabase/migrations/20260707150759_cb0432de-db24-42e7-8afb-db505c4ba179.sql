
-- Demo mode: staff/driver accounts are local (not Supabase auth users), so
-- policies scoped to authenticated never match. Open read/update to anon for
-- the operational tables the dispatcher/driver dashboards depend on.
GRANT SELECT, UPDATE ON public.shared_orders TO anon;
GRANT SELECT, UPDATE ON public.drivers TO anon;

DROP POLICY IF EXISTS "shared_orders: staff/driver read" ON public.shared_orders;
DROP POLICY IF EXISTS "shared_orders: staff/driver update" ON public.shared_orders;
CREATE POLICY "shared_orders demo read"
  ON public.shared_orders FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "shared_orders demo update"
  ON public.shared_orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "drivers: staff or self read" ON public.drivers;
DROP POLICY IF EXISTS "driver updates own row" ON public.drivers;
CREATE POLICY "drivers demo read"
  ON public.drivers FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "drivers demo update"
  ON public.drivers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
