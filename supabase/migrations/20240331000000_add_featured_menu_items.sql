-- Add featured column to menu_items table
ALTER TABLE menu_items
ADD COLUMN featured BOOLEAN DEFAULT false;
