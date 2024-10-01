import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to manually add a user (for development and testing purposes)
export async function addManualUser(email: string, password: string, role: 'admin' | 'driver' | 'customer') {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
        },
      },
    })

    if (error) throw error

    if (data.user) {
      console.log('User created successfully:', data.user)

      // Insert the user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { id: data.user.id, role: role }
        ])

      if (profileError) {
        console.error('Error inserting profile:', profileError)
        throw profileError
      }

      console.log('User profile inserted successfully')
      return data.user
    } else {
      throw new Error('User creation failed')
    }
  } catch (error) {
    console.error('Error in addManualUser:', error)
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