-- Create schools table
create table schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  admin_id uuid references auth.users not null,
  email_domain text not null unique,
  azure_tenant_id text,
  student_count int,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add school_id to profiles table
alter table profiles add column school_id uuid references schools;

-- Add RLS policies for schools table
alter table schools enable row level security;

-- School admins can view their own school
create policy "School admins can view their school"
  on schools for select
  using (admin_id = auth.uid());

-- School admins can update their own school
create policy "School admins can update their school"
  on schools for update
  using (admin_id = auth.uid());

-- School admins can view students from their domain
create policy "School admins can view their students"
  on profiles for select
  using (
    exists (
      select 1 from schools
      where schools.admin_id = auth.uid()
      and profiles.school_id = schools.id
    )
  );

-- Allow public to view schools (needed for domain lookup during registration)
create policy "Public can view schools"
  on schools for select
  using (true);
