import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, businessName } = body;

    // Create a Connected Account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'AU',
      email: email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: businessName,
        mcc: '5812', // Restaurant/Food Service
        url: 'https://edueats.com',
      },
    });

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get('origin')}/onboarding/refresh`,
      return_url: `${req.headers.get('origin')}/onboarding/complete?accountId=${account.id}&email=${encodeURIComponent(email)}&businessName=${encodeURIComponent(businessName)}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      accountId: account.id,
      accountLink: accountLink.url,
    });
  } catch (error) {
    console.error('Error creating connected account:', error);
    return NextResponse.json(
      { error: 'Failed to create connected account' },
      { status: 500 }
    );
  }
}
