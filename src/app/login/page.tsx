'use client'

import { useState } from 'react'
import MicrosoftLoginButton from '@/components/MicrosoftLoginButton'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantDescription, setRestaurantDescription] = useState('')
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isRegistering) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
            },
          },
        })

        if (authError) throw authError

        if (authData.user) {
          if (role === 'admin') {
            // Call the function to register admin and create restaurant
            const { data, error: funcError } = await supabase.rpc('register_admin_and_create_restaurant', {
              admin_id: authData.user.id,
              rest_name: restaurantName,
              rest_description: restaurantDescription
            })

            if (funcError) throw funcError
          } else {
            // Insert the user's role into the profiles table
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([
                { id: authData.user.id, role: role }
              ])

            if (profileError) throw profileError
          }

          alert('Registration successful! You can now log in.')
          setIsRegistering(false)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        if (data.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

          if (profileError) throw profileError

          // Redirect based on user role
          switch (profileData.role) {
            case 'admin':
              router.push('/admin')
              break
            case 'driver':
              router.push('/driver')
              break
            default:
              router.push('/menu')
          }
        }
      }
    } catch (error: any) {
      console.error('Error during authentication:', error)
      setError(error.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleAuth} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-[#00A7A2]">{isRegistering ? 'Register' : 'Login'} to EduEats</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        {isRegistering && (
          <>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
            >
              <option value="customer">Customer</option>
              <option value="driver">Driver</option>
              <option value="admin">Restaurant Admin</option>
            </select>
            {role === 'admin' && (
              <>
                <input
                  type="text"
                  placeholder="Restaurant Name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full p-2 mb-4 border rounded"
                  required
                />
                <textarea
                  placeholder="Restaurant Description"
                  value={restaurantDescription}
                  onChange={(e) => setRestaurantDescription(e.target.value)}
                  className="w-full p-2 mb-4 border rounded"
                  required
                />
              </>
            )}
          </>
        )}
        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white p-2 rounded mb-4"
          disabled={loading}
        >
          {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
        </button>
        <button
          type="button"
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full bg-gray-300 text-gray-800 p-2 rounded mb-4"
        >
          {isRegistering ? 'Switch to Login' : 'Switch to Register'}
        </button>

        {!isRegistering && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
            <MicrosoftLoginButton />
          </>
        )}
      </form>
    </div>
  )
}
