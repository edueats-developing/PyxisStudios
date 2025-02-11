import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    let session = null;

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);

      // Get the current session
      const { data: { session: userSession } } = await supabase.auth.getSession();
      session = userSession;

      if (session?.user) {
        const isAzureLogin = session.user.app_metadata.provider === 'azure';
        
        // Create admin client with service role key
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        // Update user's email confirmation status
        await adminClient.auth.admin.updateUserById(session.user.id, {
          email_confirm: true,
          user_metadata: {
            ...session.user.user_metadata,
            email_verified: true
          }
        });

        // For Azure/Microsoft logins, validate email and check for school association
        if (isAzureLogin) {
          const userEmail = session.user.email;
          if (!userEmail) {
            throw new Error('Email is required for registration');
          }

          // Extract domain from email
          const emailDomain = userEmail.split('@')[1];
          if (!emailDomain) {
            throw new Error('Invalid email format');
          }

          // Look up school by domain
          const { data: school, error: schoolError } = await adminClient
            .from('schools')
            .select('id')
            .eq('email_domain', emailDomain)
            .single();

          if (schoolError) {
            console.error('Error looking up school:', schoolError);
            if (schoolError.code !== 'PGRST116') { // not_found
              throw schoolError;
            }
          }

          // Create customer profile, associating with school if found
          const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({
              id: session.user.id,
              role: 'customer',
              school_id: school?.id || null,
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Error creating/updating profile:', profileError);
            throw profileError;
          }
        } else {
          // Handle regular admin registration
          const { error: restaurantError } = await adminClient
            .from('restaurants')
            .insert({
              name: session.user.user_metadata.business_name,
              admin_id: session.user.id
            })
            .select()
            .single();

          if (restaurantError && restaurantError.code !== '23505') { // Ignore unique constraint violations
            console.error('Error creating restaurant:', restaurantError);
            // Don't throw error, continue with redirect
          }
        }
      }
    }

    // Redirect based on auth type
    const redirectUrl = session?.user?.app_metadata.provider === 'azure' 
      ? new URL('/menu', url.origin)  // Microsoft users (customers/students) go straight to menu
      : new URL('/register/success', url.origin);  // Regular registration success

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in auth callback:', error);
    // Redirect to error page with error details
    const errorUrl = new URL('/register/error', new URL(request.url).origin);
    errorUrl.searchParams.set('error', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.redirect(errorUrl);
  }
}

export const dynamic = 'force-dynamic';
