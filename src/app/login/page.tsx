'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminCode, setAdminCode] = useState('')
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isRegistering) {
        let finalRole = role
        if (role === 'admin') {
          if (adminCode !== process.env.NEXT_PUBLIC_ADMIN_REGISTRATION_CODE) {
            throw new Error('Invalid admin registration code')
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: finalRole,
            },
          },
        })

        if (error) throw error

        if (data.user) {
          // Insert the user's role into the profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { id: data.user.id, role: finalRole }
            ])

          if (profileError) throw profileError

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
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          >
            <option value="customer">Customer</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
        )}
        {isRegistering && role === 'admin' && (
          <input
            type="text"
            placeholder="Admin Registration Code"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
            required
          />
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
          className="w-full bg-gray-300 text-gray-800 p-2 rounded"
        >
          {isRegistering ? 'Switch to Login' : 'Switch to Register'}
        </button>
      </form>
    </div>
  )
}