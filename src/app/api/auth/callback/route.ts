import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper function to validate school email domain
const isValidSchoolEmail = (email: string): boolean => {
  // This will be configurable via env var when Microsoft credentials are set up
  // const allowedDomains = process.env.NEXT_PUBLIC_MICROSOFT_ALLOWED_DOMAINS?.split(',') || [];
  // return allowedDomains.some(domain => email.toLowerCase().endsWith(domain.toLowerCase()));
  
  // For now, allow all email domains since we don't have the Microsoft setup yet
  return true;
};

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
        
        // For Azure/Microsoft logins, validate school email
        if (isAzureLogin) {
          const userEmail = session.user.email;
          if (!userEmail || !isValidSchoolEmail(userEmail)) {
            throw new Error('Please use your school email address to sign in.');
          }
        }

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

        // For Azure/Microsoft logins, ensure profile exists with customer role
        if (isAzureLogin) {
          const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({
              id: session.user.id,
              role: 'customer',
              updated_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Error creating/updating profile:', profileError);
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
      ? new URL('/menu', url.origin)  // Microsoft users go straight to menu
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
