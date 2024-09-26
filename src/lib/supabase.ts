import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

console.log('Initializing Supabase client with URL:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session)
})

// Test the connection
supabase.from('profiles').select('*').limit(1).then(
  ({ data, error }) => {
    if (error) {
      console.error('Error connecting to Supabase:', error)
    } else {
      console.log('Successfully connected to Supabase')
    }
  }
)