-- Create tables for menu item analytics
create table menu_item_views (
    id uuid primary key default uuid_generate_v4(),
    menu_item_id bigint references menu_items(id),
    session_id text,
    view_duration integer,
    created_at timestamp with time zone default now()
);

create table menu_item_interactions (
    id uuid primary key default uuid_generate_v4(),
    menu_item_id bigint references menu_items(id),
    interaction_type text,
    created_at timestamp with time zone default now()
);

-- Add RLS policies
alter table menu_item_views enable row level security;
alter table menu_item_interactions enable row level security;

-- Allow restaurant admins to view their own menu item analytics
create policy "Restaurant admins can view their menu analytics" on menu_item_views
    for select
    using (
        menu_item_id in (
            select id from menu_items
            where restaurant_id in (
                select id from restaurants
                where admin_id = auth.uid()
            )
        )
    );

create policy "Restaurant admins can view their menu interactions" on menu_item_interactions
    for select
    using (
        menu_item_id in (
            select id from menu_items
            where restaurant_id in (
                select id from restaurants
                where admin_id = auth.uid()
            )
        )
    );

-- Allow inserting analytics data for any menu item
create policy "Allow inserting menu view analytics" on menu_item_views
    for insert
    with check (true);

create policy "Allow inserting menu interaction analytics" on menu_item_interactions
    for insert
    with check (true);
