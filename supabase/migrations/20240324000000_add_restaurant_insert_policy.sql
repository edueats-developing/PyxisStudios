-- Add policy to allow inserting restaurants during registration
CREATE POLICY "Allow inserting restaurants during registration" ON public.restaurants
FOR INSERT WITH CHECK (true);
