GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_orders TO authenticated;
GRANT ALL ON public.shared_orders TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'shared_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_orders;
  END IF;
END $$;