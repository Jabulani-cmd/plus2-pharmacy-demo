
-- shared_orders: capture full pricing breakdown + slot + branch name
ALTER TABLE public.shared_orders
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_code text,
  ADD COLUMN IF NOT EXISTS delivery_slot text,
  ADD COLUMN IF NOT EXISTS delivery_address jsonb,
  ADD COLUMN IF NOT EXISTS branch_name text,
  ADD COLUMN IF NOT EXISTS customer_email_lower text GENERATED ALWAYS AS (lower(customer_email)) STORED;

CREATE INDEX IF NOT EXISTS idx_shared_orders_customer_email ON public.shared_orders(customer_email_lower);
CREATE INDEX IF NOT EXISTS idx_shared_orders_customer_id ON public.shared_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_shared_orders_placed_ts ON public.shared_orders(placed_ts DESC);

-- profiles: pre-fill data
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS last_address jsonb;

-- prescriptions: branch + ensure realtime
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS branch_id text,
  ADD COLUMN IF NOT EXISTS branch_name text;

-- Make customer linkage by email reliable for demo (already allowed NULL).
CREATE INDEX IF NOT EXISTS idx_rx_email ON public.prescriptions(customer_email);

-- Ensure realtime publication includes prescriptions (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'prescriptions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions';
  END IF;
END $$;
