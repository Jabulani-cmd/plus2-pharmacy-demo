DROP POLICY IF EXISTS "shared_orders demo update" ON public.shared_orders;
CREATE POLICY "shared_orders demo update"
ON public.shared_orders
FOR UPDATE
TO anon, authenticated
USING (id LIKE 'KP-LIVE-%')
WITH CHECK (
  id LIKE 'KP-LIVE-%'
  AND customer <> ''
  AND phone <> ''
  AND status IN ('Confirmed', 'Ready to dispatch', 'Packed', 'Assigned', 'Out for delivery', 'Delivered')
);

DROP POLICY IF EXISTS "drivers demo update" ON public.drivers;
CREATE POLICY "drivers demo update"
ON public.drivers
FOR UPDATE
TO anon, authenticated
USING (id IS NOT NULL AND name <> '' AND phone <> '')
WITH CHECK (id IS NOT NULL AND name <> '' AND phone <> '');