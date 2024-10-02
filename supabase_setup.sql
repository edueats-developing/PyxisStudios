-- Previous setup code...

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS create_user_profile_and_restaurant;

-- Create a function to create user profile and restaurant in a single transaction
CREATE OR REPLACE FUNCTION create_user_profile_and_restaurant(
  user_id UUID,
  user_role TEXT,
  rest_name TEXT DEFAULT NULL,
  rest_description TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  error_message TEXT;
BEGIN
  -- Start a transaction
  BEGIN
    -- Insert or update the user profile
    INSERT INTO profiles (id, role)
    VALUES (user_id, user_role)
    ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role;

    -- If the user is an admin and restaurant details are provided, create the restaurant
    IF user_role = 'admin' AND rest_name IS NOT NULL THEN
      INSERT INTO restaurants (name, description, admin_id)
      VALUES (rest_name, rest_description, user_id);
    END IF;

    -- If we reach this point without errors, commit the transaction
    RETURN 'Success';
  EXCEPTION
    WHEN OTHERS THEN
      -- Get the error message
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      
      -- Roll back the transaction
      ROLLBACK;
      
      -- Return the error message
      RETURN 'Error: ' || error_message;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile_and_restaurant TO authenticated;

-- Rest of the setup code...