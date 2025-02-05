-- Add RLS policy for order_items table to allow users to insert their own order items
CREATE POLICY "Users can insert their own order items" ON order_items
    FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );
