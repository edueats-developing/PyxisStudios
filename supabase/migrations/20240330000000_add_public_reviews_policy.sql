-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow public read access to reviews for ratings" ON reviews;

-- Create policy for public read access to reviews
CREATE POLICY "Allow public read access to reviews for ratings"
ON reviews
FOR SELECT 
TO public
USING (true);

-- Ensure RLS is enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
