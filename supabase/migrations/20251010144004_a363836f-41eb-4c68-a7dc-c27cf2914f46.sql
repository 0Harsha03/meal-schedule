-- Add meal_type for menu scheduling
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'snacks', 'dinner', 'all_day');

-- Add meal_type column to menu_items
ALTER TABLE public.menu_items
ADD COLUMN meal_type meal_type NOT NULL DEFAULT 'all_day';

-- Add indexes for better performance
CREATE INDEX idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX idx_menu_items_meal_type ON public.menu_items(meal_type);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- Add policy for customers to view their order items
CREATE POLICY "Staff can view all order items"
ON public.order_items FOR SELECT
USING (
  public.has_role(auth.uid(), 'staff'::app_role) 
  OR public.has_role(auth.uid(), 'admin'::app_role)
);