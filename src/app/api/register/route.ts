import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create standard client with anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      debug: true
    }
  }
);

export async function POST(req: Request) {
  try {
    const { email, password, accountId, businessName } = await req.json();

    // Log the request data (excluding password)
    console.log('Registration request:', {
      email,
      accountId,
      businessName,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

    // Validate required fields
    if (!email || !password || !accountId || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields', details: { email, accountId, businessName } },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    console.log('Starting user registration process...');

    // Attempt to create the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/register/success`,
        data: {
          stripe_account_id: accountId,
          business_name: businessName,
          role: 'admin'
        }
      }
    });

    // Handle any errors during sign up
    if (signUpError) {
      console.error('Sign up error details:', {
        message: signUpError.message,
        status: signUpError.status,
        name: signUpError.name,
        code: signUpError.code,
        stack: signUpError.stack,
        details: signUpError
      });

      // Check if user already exists
      if (signUpError.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to create user account',
          details: signUpError.message
        },
        { status: 500 }
      );
    }

    // Verify we have user data
    if (!signUpData.user) {
      console.error('No user data returned from sign up');
      return NextResponse.json(
        { error: 'Failed to create user - no user data returned' },
        { status: 500 }
      );
    }

    console.log('User created successfully:', {
      userId: signUpData.user.id,
      email: signUpData.user.email,
      metadata: signUpData.user.user_metadata
    });

    return NextResponse.json({
      success: true,
      user: {
        id: signUpData.user.id,
        email: signUpData.user.email
      },
      message: 'Please check your email to verify your account'
    });

  } catch (error) {
    console.error('Unexpected registration error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
