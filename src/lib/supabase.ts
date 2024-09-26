import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

// Create a separate admin client using the service role key
let supabaseAdmin: ReturnType<typeof createClient> | null = null
if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
} else {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin functions will not work.')
}

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

// Function to manually add a user (for development and testing purposes)
export async function addManualUser(email: string, password: string, role: 'admin' | 'driver' | 'customer') {
  if (!supabaseAdmin) {
    throw new Error('Admin client is not initialized. Cannot add manual user.')
  }

  try {
    // Create the user with the role in the user metadata using the admin client
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: role }
    })

    if (userError) throw userError

    if (userData.user) {
      console.log('User created successfully:', userData.user)

      // Insert the user's profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([
          { id: userData.user.id, role: role }
        ])

      if (profileError) {
        console.error('Error inserting profile:', profileError)
        throw profileError
      }

      return userData.user
    } else {
      throw new Error('User creation failed')
    }
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

// Function to get a user's profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }

  return data
}

// Function to update a user's profile
export async function updateUserProfile(userId: string, profileData: Partial<{ role: string, first_name: string, last_name: string, phone: string }>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId)

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data
}