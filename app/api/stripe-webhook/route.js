import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' }) : null;
const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

async function handleCheckoutSessionCompleted(session) {
  try {
    const passId = session.metadata?.passId;
    if (!passId) {
      console.error('No pass ID found in session metadata');
      return;
    }

    const { error } = await supabase
      .from('press_passes')
      .update({
        paid: true,
        payment_pending: false,
        payment_id: session.id,
        payment_amount: session.amount_total,
        payment_date: new Date().toISOString()
      })
      .eq('pass_number', passId);

    if (error) {
      console.error('Error updating press pass record:', error);
    }
  } catch (err) {
    console.error('Error handling checkout session completed:', err);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
      limit: 1
    });

    if (sessions.data.length === 0) {
      console.error('No session found for payment intent:', paymentIntent.id);
      return;
    }

    const session = sessions.data[0];
    const passId = session.metadata?.passId;
    if (!passId) {
      console.error('No pass ID found in session metadata');
      return;
    }

    const { error } = await supabase
      .from('press_passes')
      .update({
        paid: true,
        payment_pending: false,
        payment_id: paymentIntent.id,
        payment_amount: paymentIntent.amount,
        payment_date: new Date().toISOString()
      })
      .eq('pass_number', passId);

    if (error) {
      console.error('Error updating press pass record:', error);
    }
  } catch (err) {
    console.error('Error handling payment intent succeeded:', err);
  }
}

export async function POST(request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Missing Stripe configuration' }, { status: 500 });
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const signature = request.headers.get('stripe-signature');

  try {
    const rawBody = await request.text();
    let stripeEvent;

    try {
      stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripeEvent.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(stripeEvent.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook handler failed', details: err.message }, { status: 500 });
  }
}
