-- Extend order_items table to support combo meals and advanced options
-- This migration adds support for:
-- 1. Combo meals (combo_meal_id, combo_meal_name)
-- 2. Size variations (selected_size, size_price_modifier)
-- 3. Modifiers/add-ons (selected_modifiers as JSONB)
-- 4. Total price calculation (total_price)

-- Add new columns to order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS combo_meal_id UUID REFERENCES public.combo_meals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS combo_meal_name TEXT,
ADD COLUMN IF NOT EXISTS selected_size TEXT,
ADD COLUMN IF NOT EXISTS size_price_modifier NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS selected_modifiers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS modifiers_total_price NUMERIC(10,2) DEFAULT 0;

-- Create a function to calculate total price with modifiers
CREATE OR REPLACE FUNCTION calculate_order_item_total_price(
  p_unit_price NUMERIC,
  p_size_price_modifier NUMERIC,
  p_quantity INTEGER,
  p_modifiers_total_price NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  RETURN (p_unit_price + COALESCE(p_size_price_modifier, 0)) * p_quantity + (p_modifiers_total_price * p_quantity);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed column for total price
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2) GENERATED ALWAYS AS (
  calculate_order_item_total_price(unit_price, size_price_modifier, quantity, modifiers_total_price)
) STORED;

-- Add comments for documentation
COMMENT ON COLUMN public.order_items.combo_meal_id IS 'Reference to combo meal if this item is part of a combo';
COMMENT ON COLUMN public.order_items.combo_meal_name IS 'Name of the combo meal for display purposes';
COMMENT ON COLUMN public.order_items.selected_size IS 'Selected size variation (e.g., "Small", "Medium", "Large")';
COMMENT ON COLUMN public.order_items.size_price_modifier IS 'Price modifier for the selected size';
COMMENT ON COLUMN public.order_items.selected_modifiers IS 'JSON array of selected modifiers with their details';
COMMENT ON COLUMN public.order_items.modifiers_total_price IS 'Total price of all selected modifiers';
COMMENT ON COLUMN public.order_items.total_price IS 'Calculated total price including size and modifier costs';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_combo_meal_id ON public.order_items(combo_meal_id);
CREATE INDEX IF NOT EXISTS idx_order_items_selected_modifiers ON public.order_items USING GIN(selected_modifiers);

-- Add RLS policies for the new columns
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy for restaurant staff to view order items with advanced options
CREATE POLICY "Restaurant staff can view order items with advanced options" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.restaurants r ON o.restaurant_id = r.id
    WHERE o.id = order_items.order_id
    AND (
      r.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.staff s
        WHERE s.restaurant_id = r.id
        AND s.user_id = auth.uid()
        AND 'orders:read' = ANY(s.permissions)
      )
    )
  )
);

-- Policy for restaurant staff to insert order items with advanced options
CREATE POLICY "Restaurant staff can insert order items with advanced options" ON public.order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.restaurants r ON o.restaurant_id = r.id
    WHERE o.id = order_items.order_id
    AND (
      r.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.staff s
        WHERE s.restaurant_id = r.id
        AND s.user_id = auth.uid()
        AND 'orders:write' = ANY(s.permissions)
      )
    )
  )
);

-- Policy for restaurant staff to update order items with advanced options
CREATE POLICY "Restaurant staff can update order items with advanced options" ON public.order_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.restaurants r ON o.restaurant_id = r.id
    WHERE o.id = order_items.order_id
    AND (
      r.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.staff s
        WHERE s.restaurant_id = r.id
        AND s.user_id = auth.uid()
        AND 'orders:write' = ANY(s.permissions)
      )
    )
  )
);

-- Policy for restaurant staff to delete order items with advanced options
CREATE POLICY "Restaurant staff can delete order items with advanced options" ON public.order_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.restaurants r ON o.restaurant_id = r.id
    WHERE o.id = order_items.order_id
    AND (
      r.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.staff s
        WHERE s.restaurant_id = r.id
        AND s.user_id = auth.uid()
        AND 'orders:write' = ANY(s.permissions)
      )
    )
  )
); 