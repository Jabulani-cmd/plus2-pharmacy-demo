DROP POLICY IF EXISTS shared_orders_delivery_progress_update ON public.shared_orders;
CREATE POLICY shared_orders_delivery_progress_update ON public.shared_orders
  FOR UPDATE
  USING ((id LIKE 'KP-LIVE-%') AND (status = ANY (ARRAY['Confirmed','Ready to dispatch','Packed','Assigned','Out for delivery','Delivered'])))
  WITH CHECK ((id LIKE 'KP-LIVE-%') AND (status = ANY (ARRAY['Confirmed','Ready to dispatch','Packed','Assigned','Out for delivery','Delivered'])));