-- Create menu_item_variants table
CREATE TABLE menu_item_variants (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create menu_item_addons table
CREATE TABLE menu_item_addons (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE menu_item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_addons ENABLE ROW LEVEL SECURITY;

-- Public read access for variants
CREATE POLICY "Public read access to menu item variants"
    ON menu_item_variants
    FOR SELECT
    TO public
    USING (true);

-- Public read access for addons
CREATE POLICY "Public read access to menu item addons"
    ON menu_item_addons
    FOR SELECT
    TO public
    USING (true);

-- Restaurant admin access for variants
CREATE POLICY "Restaurant admins can manage their menu item variants"
    ON menu_item_variants
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM menu_items mi
            JOIN restaurants r ON mi.restaurant_id = r.id
            WHERE mi.id = menu_item_variants.menu_item_id
            AND r.admin_id = auth.uid()
        )
    );

-- Restaurant admin access for addons
CREATE POLICY "Restaurant admins can manage their menu item addons"
    ON menu_item_addons
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM menu_items mi
            JOIN restaurants r ON mi.restaurant_id = r.id
            WHERE mi.id = menu_item_addons.menu_item_id
            AND r.admin_id = auth.uid()
        )
    );
