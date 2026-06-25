REVOKE DELETE ON public.shared_orders FROM anon, authenticated;
REVOKE UPDATE ON public.shared_orders FROM anon, authenticated;
GRANT UPDATE (status, driver_name, driver_phone, driver_vehicle, packed_at, dispatched_at, delivered_at, eta, out_for_delivery_ts, updated_at) ON public.shared_orders TO anon, authenticated;

DROP POLICY IF EXISTS shared_orders_all_insert ON public.shared_orders;
DROP POLICY IF EXISTS shared_orders_all_update ON public.shared_orders;
DROP POLICY IF EXISTS shared_orders_all_delete ON public.shared_orders;

CREATE POLICY "shared_orders_checkout_insert"
ON public.shared_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  id LIKE 'KP-LIVE-%'
  AND customer <> ''
  AND phone <> ''
  AND status = 'Confirmed'
);

CREATE POLICY "shared_orders_delivery_progress_update"
ON public.shared_orders
FOR UPDATE
TO anon, authenticated
USING (
  id LIKE 'KP-LIVE-%'
  AND status IN ('Confirmed', 'Packed', 'Assigned', 'Out for delivery', 'Delivered')
)
WITH CHECK (
  id LIKE 'KP-LIVE-%'
  AND status IN ('Confirmed', 'Packed', 'Assigned', 'Out for delivery', 'Delivered')
);

UPDATE public.shared_orders
SET status = 'Delivered',
    delivered_at = COALESCE(delivered_at, to_char(now() AT TIME ZONE 'Africa/Harare', 'DD Mon, HH24:MI')),
    updated_at = now()
WHERE id = 'KP-LIVE-17038'
  AND status <> 'Delivered';