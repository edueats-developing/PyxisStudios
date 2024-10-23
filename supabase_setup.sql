-- Step 1: Add restaurant_id column to order_items table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'restaurant_id'
  ) THEN
    ALTER TABLE public.order_items
    ADD COLUMN restaurant_id INTEGER;
  END IF;
END
$$;

-- Step 2: Update existing order_items with restaurant_id
UPDATE public.order_items
SET restaurant_id = menu_items.restaurant_id
FROM public.menu_items
WHERE order_items.menu_item_id = menu_items.id
AND order_items.restaurant_id IS NULL;

-- Step 3: Check for any remaining NULL values in restaurant_id
SELECT COUNT(*) as null_count
FROM public.order_items
WHERE restaurant_id IS NULL;

-- If the above query returns 0, proceed with the following steps:

-- Step 4: Make restaurant_id NOT NULL
-- ALTER TABLE public.order_items
-- ALTER COLUMN restaurant_id SET NOT NULL;

-- Step 5: Add foreign key constraint
-- ALTER TABLE public.order_items
-- ADD CONSTRAINT fk_order_items_restaurant
-- FOREIGN KEY (restaurant_id)
-- REFERENCES public.restaurants(id);

-- Step 6: Create an index on restaurant_id for better query performance
-- CREATE INDEX IF NOT EXISTS idx_order_items_restaurant_id ON public.order_items(restaurant_id);

-- Step 7: Allow users to insert their own order items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' AND policyname = 'Users can insert their own order items'
  ) THEN
    CREATE POLICY "Users can insert their own order items" ON public.order_items
    FOR INSERT WITH CHECK (
      auth.uid() IN (
        SELECT orders.user_id
        FROM public.orders
        WHERE orders.id = order_items.order_id
      )
    );
  END IF;
END
$$;

-- Step 8: Enable RLS on the order_items table if not already enabled
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items' AND column_name = 'restaurant_id';
