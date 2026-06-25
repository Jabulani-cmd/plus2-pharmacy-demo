CREATE TABLE IF NOT EXISTS public.shared_orders (
  id text PRIMARY KEY,
  customer_id text,
  customer_email text,
  customer text NOT NULL,
  phone text NOT NULL DEFAULT '',
  branch_id text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  item_count integer NOT NULL DEFAULT 0,
  address text NOT NULL DEFAULT '',
  delivery_method text NOT NULL DEFAULT '',
  payment_method text NOT NULL DEFAULT '',
  payment_ref text NOT NULL DEFAULT '',
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Confirmed',
  placed_at text NOT NULL DEFAULT '',
  placed_ts bigint NOT NULL DEFAULT 0,
  driver_name text,
  driver_phone text,
  driver_vehicle text,
  packed_at text,
  dispatched_at text,
  delivered_at text,
  eta text,
  out_for_delivery_ts bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_orders TO anon, authenticated;
GRANT ALL ON public.shared_orders TO service_role;

ALTER TABLE public.shared_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_orders_all_select" ON public.shared_orders FOR SELECT USING (true);
CREATE POLICY "shared_orders_all_insert" ON public.shared_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "shared_orders_all_update" ON public.shared_orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "shared_orders_all_delete" ON public.shared_orders FOR DELETE USING (true);

ALTER TABLE public.shared_orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_orders;