-- [Previous content remains unchanged]

-- Function to register admin and create restaurant
CREATE OR REPLACE FUNCTION register_admin_and_create_restaurant(
  admin_id UUID,
  rest_name TEXT,
  rest_description TEXT
) RETURNS VOID AS $$
BEGIN
  -- Insert the admin's role into the profiles table
  INSERT INTO profiles (id, role)
  VALUES (admin_id, 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  -- Create a restaurant for the admin
  INSERT INTO restaurants (name, description, admin_id)
  VALUES (rest_name, rest_description, admin_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION register_admin_and_create_restaurant TO authenticated;

-- [Rest of the content remains unchanged]
