-- Create delivery confirmations table
CREATE TABLE public.delivery_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id INTEGER REFERENCES public.orders(id),
    photo_url TEXT NOT NULL,
    signature_url TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    driver_id UUID REFERENCES auth.users(id)
);

-- Create order items checklist table
CREATE TABLE public.order_items_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id INTEGER REFERENCES public.order_items(id),
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verification_method TEXT CHECK (verification_method IN ('manual', 'barcode', 'qr_code')),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Create order status logs table
CREATE TABLE public.order_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id INTEGER REFERENCES public.orders(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Add RLS policies

-- Delivery confirmations policies
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can insert delivery confirmations"
ON public.delivery_confirmations
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Restaurant admins can view delivery confirmations"
ON public.delivery_confirmations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.restaurants r ON o.restaurant_id = r.id
        WHERE o.id = delivery_confirmations.order_id
        AND r.admin_id = auth.uid()
    )
);

-- Order items checklist policies
ALTER TABLE public.order_items_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can update checklist items"
ON public.order_items_checklist
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'driver'
    )
);

CREATE POLICY "Restaurant admins can view checklist"
ON public.order_items_checklist
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.orders o ON oi.order_id = o.id
        JOIN public.restaurants r ON o.restaurant_id = r.id
        WHERE oi.id = order_items_checklist.order_item_id
        AND r.admin_id = auth.uid()
    )
);

-- Order status logs policies
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant admins and drivers can insert status logs"
ON public.order_status_logs
FOR INSERT
WITH CHECK (
    auth.uid() = changed_by 
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'driver'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.restaurants r ON o.restaurant_id = r.id
            WHERE o.id = order_status_logs.order_id
            AND r.admin_id = auth.uid()
        )
    )
);

CREATE POLICY "Restaurant admins can view status logs"
ON public.order_status_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.restaurants r ON o.restaurant_id = r.id
        WHERE o.id = order_status_logs.order_id
        AND r.admin_id = auth.uid()
    )
);

-- Create storage bucket for delivery photos
INSERT INTO storage.buckets (id, name)
VALUES ('delivery-photos', 'delivery-photos')
ON CONFLICT DO NOTHING;

-- Storage policies for delivery photos
CREATE POLICY "Drivers can upload delivery photos"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'delivery-photos'
    AND (
        SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'driver'
);

CREATE POLICY "Restaurant admins can view delivery photos"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'delivery-photos'
    AND EXISTS (
        SELECT 1 FROM public.delivery_confirmations dc
        JOIN public.orders o ON dc.order_id = o.id
        JOIN public.restaurants r ON o.restaurant_id = r.id
        WHERE dc.photo_url = name
        AND r.admin_id = auth.uid()
    )
);
