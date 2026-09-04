// ==============================================================================
// COOKLY — SUPABASE EDGE FUNCTION: STRIPE WEBHOOK HANDLER
// Verifies HMAC SHA-256 signature from Stripe and synchronizes subscription state
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req: Request) => {
  const signature = req.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const clientReferenceId = session.client_reference_id; // user_id

        if (clientReferenceId) {
          // Update profile and subscription
          await supabaseAdmin.from('profiles').update({
            subscription_tier: 'pro',
            subscription_status: 'active',
          }).eq('id', clientReferenceId);

          await supabaseAdmin.from('subscriptions').upsert({
            user_id: clientReferenceId,
            stripe_customer_id: customerId,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            plan: 'pro',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        const { data: subData } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subData?.user_id) {
          const isPro = status === 'active' || status === 'trialing';
          await supabaseAdmin.from('profiles').update({
            subscription_tier: isPro ? 'pro' : 'free',
            subscription_status: status,
          }).eq('id', subData.user_id);

          await supabaseAdmin.from('subscriptions').update({
            status: status,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subscription.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: subData } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subData?.user_id) {
          await supabaseAdmin.from('profiles').update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
          }).eq('id', subData.user_id);

          await supabaseAdmin.from('subscriptions').update({
            status: 'canceled',
            plan: 'free',
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', subscription.id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
