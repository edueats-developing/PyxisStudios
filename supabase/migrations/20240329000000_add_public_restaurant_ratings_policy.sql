-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow public read access to restaurant ratings" ON restaurants;

-- Create policy for public read access to restaurants table
CREATE POLICY "Allow public read access to restaurant ratings"
ON restaurants
FOR SELECT 
TO public
USING (true);

-- Ensure the RLS is enabled on the restaurants table
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
