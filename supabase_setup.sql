-- Allow users to insert their own order items
CREATE POLICY "Users can insert their own order items" ON public.order_items
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT orders.user_id
    FROM public.orders
    WHERE orders.id = order_items.order_id
  )
);

-- Enable RLS on the order_items table if not already enabled
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
