-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can insert into category column" ON restaurants;

-- Alter categories column to be text array
ALTER TABLE restaurants 
ALTER COLUMN categories TYPE text[] USING 
  CASE 
    WHEN categories IS NULL THEN NULL
    WHEN categories = '' THEN '{}'::text[]
    ELSE string_to_array(trim(both '[]' from categories), ',')
  END;

-- Add an index to improve array operation performance
CREATE INDEX IF NOT EXISTS idx_restaurants_categories ON restaurants USING GIN (categories);

-- Recreate the policy
CREATE POLICY "Authenticated users can insert into category column"
ON restaurants
FOR INSERT
TO authenticated
WITH CHECK (true);
