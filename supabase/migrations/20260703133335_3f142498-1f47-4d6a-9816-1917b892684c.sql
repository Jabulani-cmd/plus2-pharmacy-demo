
-- === drivers: remove public read; only staff and the driver's own row ===
DROP POLICY IF EXISTS "drivers read all" ON public.drivers;
CREATE POLICY "drivers: staff or self read"
  ON public.drivers FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()) OR auth.uid() = auth_user_id);
REVOKE SELECT ON public.drivers FROM anon;

-- === shared_orders: restrict reads and updates to authenticated staff/drivers ===
DROP POLICY IF EXISTS shared_orders_all_select ON public.shared_orders;
CREATE POLICY "shared_orders: staff/driver read"
  ON public.shared_orders FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(), 'driver'::app_role));

DROP POLICY IF EXISTS shared_orders_delivery_progress_update ON public.shared_orders;
CREATE POLICY "shared_orders: staff/driver update"
  ON public.shared_orders FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(), 'driver'::app_role))
  WITH CHECK (public.is_staff(auth.uid()) OR public.has_role(auth.uid(), 'driver'::app_role));

REVOKE SELECT, UPDATE ON public.shared_orders FROM anon;

-- Add payment_verified flag; real gateway integration must set this true
ALTER TABLE public.shared_orders
  ADD COLUMN IF NOT EXISTS payment_verified boolean NOT NULL DEFAULT false;

-- === loyalty_points: customers cannot self-award points ===
DROP POLICY IF EXISTS "loyalty: update own" ON public.loyalty_points;
CREATE POLICY "loyalty: staff update"
  ON public.loyalty_points FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- === orders: customers can only cancel; staff/driver can update ===
DROP POLICY IF EXISTS "orders: customer updates own (cancel)" ON public.orders;
CREATE POLICY "orders: staff/driver update"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()) OR auth.uid() = driver_id)
  WITH CHECK (public.is_staff(auth.uid()) OR auth.uid() = driver_id);

CREATE POLICY "orders: customer cancel own"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id AND status <> 'Delivered')
  WITH CHECK (
    auth.uid() = customer_id
    AND status = 'Cancelled'
  );

-- === prescriptions: customers cannot change status/quotation/pharmacist fields ===
DROP POLICY IF EXISTS "rx: customer/staff update" ON public.prescriptions;
CREATE POLICY "rx: staff/driver update"
  ON public.prescriptions FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()) OR auth.uid() = driver_id)
  WITH CHECK (public.is_staff(auth.uid()) OR auth.uid() = driver_id);

CREATE POLICY "rx: customer restricted update"
  ON public.prescriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (
    auth.uid() = customer_id
    AND status IN ('Pending', 'Cancelled')
  );
