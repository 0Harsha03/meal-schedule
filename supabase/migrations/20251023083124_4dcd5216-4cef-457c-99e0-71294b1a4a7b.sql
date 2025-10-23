-- Add payment tracking to orders table
ALTER TABLE public.orders ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
ALTER TABLE public.orders ADD COLUMN stripe_session_id text;
ALTER TABLE public.orders ADD COLUMN stripe_payment_intent_id text;

-- Add index for faster payment status lookups
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_stripe_session_id ON public.orders(stripe_session_id);