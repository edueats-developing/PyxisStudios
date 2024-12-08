import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
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

        // Create restaurant if it doesn't exist
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

    // Redirect to success page
    return NextResponse.redirect(new URL('/register/success', url.origin));
  } catch (error) {
    console.error('Error in auth callback:', error);
    // Redirect to error page with error details
    const errorUrl = new URL('/register/error', new URL(request.url).origin);
    errorUrl.searchParams.set('error', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.redirect(errorUrl);
  }
}

export const dynamic = 'force-dynamic';
