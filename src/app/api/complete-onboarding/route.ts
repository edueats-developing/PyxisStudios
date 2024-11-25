import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, businessName, accountId } = await req.json();

    // Create user with email confirmation required
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false, // This will trigger sending a confirmation email
      user_metadata: { stripe_account_id: accountId }
    });

    if (userError) {
      throw userError;
    }

    // Create profile with admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.user.id,
        role: 'admin',
      });

    if (profileError) {
      throw profileError;
    }

    // Create restaurant
    const { error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: businessName,
        admin_id: user.user.id,
      });

    if (restaurantError) {
      throw restaurantError;
    }

    return NextResponse.json({ 
      success: true,
      message: 'Please check your email to confirm your account and set your password.'
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
