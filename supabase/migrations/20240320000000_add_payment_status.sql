-- Add payment_status column to orders table
ALTER TABLE public.orders ADD COLUMN payment_status text DEFAULT 'pending';

-- Update RLS policies to allow payment status updates
CREATE POLICY "Users can update payment status of their own orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
