-- Add username column to profiles table
alter table profiles
add column username text;

-- Create restaurant_staff table
create table restaurant_staff (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id bigint references restaurants(id),
  profile_id uuid references profiles(id),
  role text check (role in ('viewer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  created_by uuid references profiles(id)
);

-- Enable RLS
alter table restaurant_staff enable row level security;

-- Restaurant admins can manage their staff
create policy "Restaurant admins can manage their staff"
on restaurant_staff
for all using (
  exists (
    select 1 from restaurants
    where restaurants.id = restaurant_staff.restaurant_id
    and restaurants.admin_id = auth.uid()
  )
);

-- Staff can view their own records
create policy "Staff can view their own record"
on restaurant_staff
for select using (
  profile_id = auth.uid()
);

-- Add policies to orders table for staff viewers
create policy "Restaurant staff can view orders"
on orders
for select using (
  exists (
    select 1 from restaurant_staff
    where restaurant_staff.restaurant_id = orders.restaurant_id
    and restaurant_staff.profile_id = auth.uid()
    and restaurant_staff.role = 'viewer'
  )
);

-- Add policies to order_items table for staff viewers
create policy "Restaurant staff can view order items"
on order_items
for select using (
  exists (
    select 1 from orders
    where orders.id = order_items.order_id
    and exists (
      select 1 from restaurant_staff
      where restaurant_staff.restaurant_id = orders.restaurant_id
      and restaurant_staff.profile_id = auth.uid()
      and restaurant_staff.role = 'viewer'
    )
  )
);
