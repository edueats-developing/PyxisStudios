import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Update order status in database
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', paymentIntent.metadata.orderId);

      if (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
          { error: 'Error updating order status' },
          { status: 500 }
        );
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Update order status in database
      const { error: failedError } = await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', failedPaymentIntent.metadata.orderId);

      if (failedError) {
        console.error('Error updating order:', failedError);
        return NextResponse.json(
          { error: 'Error updating order status' },
          { status: 500 }
        );
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
