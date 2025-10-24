import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data } = await supabaseClient.auth.getUser();
    const user = data?.user;

    if (!user?.email) {
      throw new Error('User not authenticated or email missing');
    }

    const { orderId } = await req.json();
    if (!orderId) throw new Error('Order ID required');

    console.log(`🔹 Creating checkout for order: ${orderId}`);

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price_at_time,
          menu_item_id,
          menu_items (name)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) throw new Error('Order not found');
    if (order.customer_id !== user.id) throw new Error('Unauthorized order access');

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) throw new Error('Stripe secret key not set in environment');

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2024-04-10',
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length ? customers.data[0].id : undefined;

    const lineItems = order.order_items.map((item: any) => ({
      price_data: {
        currency: 'inr',
        product_data: { name: item.menu_items.name },
        unit_amount: Math.round(item.price_at_time * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/order?canceled=true`,
      metadata: { orderId, userId: user.id },
    });

    await supabaseClient.from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', orderId);

    console.log(`✅ Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('❌ Stripe checkout error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
