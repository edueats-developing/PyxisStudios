-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'customer')),
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create restaurants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.restaurants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Restaurant admins can view their restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant admins can update their restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Users can insert restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurants are viewable by everyone" ON public.restaurants;

-- Create new policies
CREATE POLICY "Restaurants are viewable by everyone" ON public.restaurants
  FOR SELECT USING (true);

CREATE POLICY "Restaurant admins can update their restaurants" ON public.restaurants
  FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "Users can insert restaurants" ON public.restaurants
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email)
  VALUES (NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_update ON auth.users;

-- Create trigger for profile updates
CREATE TRIGGER on_user_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();
