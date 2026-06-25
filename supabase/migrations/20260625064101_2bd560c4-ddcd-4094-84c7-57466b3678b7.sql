
-- ============================================================
-- ROLES + has_role()
-- ============================================================
CREATE TYPE public.app_role AS ENUM (
  'customer', 'staff', 'pharmacist', 'dispatcher',
  'cashier', 'inventory', 'manager', 'admin', 'driver'
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('staff','pharmacist','dispatcher','cashier','inventory','manager','admin')
  )
$$;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  email text,
  branch_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE public.orders (
  id text PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  phone text,
  branch_id text,
  address text,
  delivery_method text,
  payment_method text,
  payment_ref text,
  total numeric(12,2) NOT NULL DEFAULT 0,
  item_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Confirmed',
  driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_name text,
  driver_phone text,
  driver_vehicle text,
  packed_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  out_for_delivery_ts bigint,
  eta text,
  placed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders: customer reads own" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR public.is_staff(auth.uid()) OR auth.uid() = driver_id);
CREATE POLICY "orders: customer creates own" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "orders: customer updates own (cancel)" ON public.orders FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id OR public.is_staff(auth.uid()) OR auth.uid() = driver_id);

CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_driver ON public.orders(driver_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_placed ON public.orders(placed_at DESC);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  qty int NOT NULL DEFAULT 1,
  price numeric(12,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items: follow parent order" ON public.order_items FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
      AND (o.customer_id = auth.uid() OR public.is_staff(auth.uid()) OR o.driver_id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
      AND (o.customer_id = auth.uid() OR public.is_staff(auth.uid())))
  );
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ============================================================
-- PRESCRIPTIONS
-- ============================================================
CREATE TABLE public.prescriptions (
  id text PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  file_name text,
  patient_name text,
  doctor_name text,
  notes text,
  status text NOT NULL DEFAULT 'Pending',
  files jsonb,
  for_self boolean,
  relationship text,
  script_date text,
  is_repeat boolean,
  repeats_left int,
  delivery text,
  delivery_address jsonb,
  collection_branch_id text,
  quotation jsonb,
  payment_ref text,
  payment_method text,
  paid_at timestamptz,
  pharmacist_notes text,
  approved_at timestamptz,
  rejection_reason text,
  driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_name text,
  driver_phone text,
  driver_vehicle text,
  dispatched_at timestamptz,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rx: customer reads own" ON public.prescriptions FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR public.is_staff(auth.uid()) OR auth.uid() = driver_id);
CREATE POLICY "rx: customer creates own" ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "rx: customer/staff update" ON public.prescriptions FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id OR public.is_staff(auth.uid()) OR auth.uid() = driver_id);

CREATE INDEX idx_rx_customer ON public.prescriptions(customer_id);
CREATE INDEX idx_rx_status ON public.prescriptions(status);
CREATE INDEX idx_rx_uploaded ON public.prescriptions(uploaded_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL CHECK (audience IN ('customer','staff','driver')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  link text,
  link_search jsonb,
  tone text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif: read by audience" ON public.notifications FOR SELECT TO authenticated
  USING (
    (audience = 'customer' AND (user_id IS NULL OR user_id = auth.uid()))
    OR (audience = 'staff' AND public.is_staff(auth.uid()))
    OR (audience = 'driver' AND (user_id IS NULL OR user_id = auth.uid()) AND public.has_role(auth.uid(), 'driver'))
  );
CREATE POLICY "notif: insert any (server-side already validates)" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notif: mark own read" ON public.notifications FOR UPDATE TO authenticated
  USING (
    (audience = 'customer' AND user_id = auth.uid())
    OR (audience = 'staff' AND public.is_staff(auth.uid()))
    OR (audience = 'driver' AND user_id = auth.uid())
  );
CREATE INDEX idx_notif_audience_user ON public.notifications(audience, user_id, created_at DESC);

-- ============================================================
-- ORDER MESSAGES (chat)
-- ============================================================
CREATE TABLE public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('customer','driver','staff')),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_messages TO authenticated;
GRANT ALL ON public.order_messages TO service_role;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg: parties read" ON public.order_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
      AND (o.customer_id = auth.uid() OR public.is_staff(auth.uid()) OR o.driver_id = auth.uid()))
  );
CREATE POLICY "msg: parties send" ON public.order_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
      AND (o.customer_id = auth.uid() OR public.is_staff(auth.uid()) OR o.driver_id = auth.uid()))
  );
CREATE INDEX idx_msg_order ON public.order_messages(order_id, created_at);

-- ============================================================
-- ORDER RATINGS
-- ============================================================
CREATE TABLE public.order_ratings (
  order_id text PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars int NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.order_ratings TO authenticated;
GRANT ALL ON public.order_ratings TO service_role;
ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rating: customer manages own" ON public.order_ratings FOR ALL TO authenticated
  USING (auth.uid() = customer_id OR public.is_staff(auth.uid()))
  WITH CHECK (auth.uid() = customer_id);

-- ============================================================
-- LOYALTY POINTS
-- ============================================================
CREATE TABLE public.loyalty_points (
  customer_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.loyalty_points TO authenticated;
GRANT ALL ON public.loyalty_points TO service_role;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty: read own" ON public.loyalty_points FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR public.is_staff(auth.uid()));
CREATE POLICY "loyalty: upsert own" ON public.loyalty_points FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "loyalty: update own" ON public.loyalty_points FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id OR public.is_staff(auth.uid()));

-- ============================================================
-- REALTIME PUBLICATION
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_points;
