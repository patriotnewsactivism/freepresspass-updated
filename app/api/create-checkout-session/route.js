import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' }) : null;
const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

function resolveBaseUrl(request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  return host ? `${proto}://${host}` : '';
}

export async function POST(request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  try {
    const data = await request.json();

    if (!data.name || !data.passId) {
      return NextResponse.json(
        { error: 'Missing required fields: name or passId' },
        { status: 400 }
      );
    }

    // Create a temporary record in Supabase for this checkout
    try {
      const { error: dbError } = await supabase.from('press_passes').insert({
        name: data.name,
        email: data.email || null,
        title: data.title || null,
        pass_number: data.passId,
        created_at: new Date().toISOString(),
        paid: false,
        payment_pending: true
      });

      if (dbError) {
        console.error('Database error:', dbError);
      }
    } catch (dbErr) {
      console.error('Error saving to database:', dbErr);
    }

    const baseUrl = resolveBaseUrl(request);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Enhanced Press Pass',
              description: `Laminated Press Pass for ${data.name}`,
              images: [`${baseUrl}/assets/press-pass-preview.jpg`]
            },
            unit_amount: 1500
          },
          quantity: data.quantity || 1
        }
      ],
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&pass_id=${data.passId}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        passId: data.passId,
        name: data.name,
        email: data.email || '',
        title: data.title || ''
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: err.message },
      { status: 500 }
    );
  }
}
