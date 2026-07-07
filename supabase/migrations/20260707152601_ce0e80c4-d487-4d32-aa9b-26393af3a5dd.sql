GRANT SELECT, INSERT, UPDATE ON public.shared_orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_orders TO authenticated;
GRANT ALL ON public.shared_orders TO service_role;

GRANT SELECT, UPDATE ON public.drivers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;