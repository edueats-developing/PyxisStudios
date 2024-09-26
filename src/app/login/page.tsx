'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const COOLDOWN_PERIOD = 60 * 1000 // 60 seconds in milliseconds

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminCode, setAdminCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const storedCooldownEnd = localStorage.getItem('registrationCooldownEnd')
    if (storedCooldownEnd) {
      const remainingCooldown = Math.max(0, parseInt(storedCooldownEnd) - Date.now())
      setCooldown(Math.ceil(remainingCooldown / 1000))
    }

    const timer = setInterval(() => {
      setCooldown((prevCooldown) => {
        const newCooldown = Math.max(0, prevCooldown - 1)
        if (newCooldown === 0) {
          localStorage.removeItem('registrationCooldownEnd')
        }
        return newCooldown
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(email)
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('Starting authentication process')

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (isRegistering && cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before attempting to register again.`)
      setLoading(false)
      return
    }

    try {
      if (isRegistering) {
        let finalRole = role
        if (role === 'admin') {
          if (adminCode !== process.env.NEXT_PUBLIC_ADMIN_REGISTRATION_CODE) {
            throw new Error('Invalid admin registration code')
          }
        }

        console.log('Registering user with role:', finalRole)

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: finalRole,
            },
          },
        })

        console.log('Supabase signUp response:', { data, error })

        if (error) {
          console.error('Supabase signUp error:', error)
          if (error.status === 429) {
            const cooldownEnd = Date.now() + COOLDOWN_PERIOD
            localStorage.setItem('registrationCooldownEnd', cooldownEnd.toString())
            setCooldown(60)
            throw new Error('Too many registration attempts. Please try again in 60 seconds.')
          }
          throw error
        }

        if (data.user) {
          console.log('Inserting user profile with role:', finalRole)
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { id: data.user.id, role: finalRole }
            ])

          if (profileError) {
            console.error('Error inserting profile:', profileError)
            throw profileError
          }

          console.log('Profile inserted successfully')

          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError) {
            console.error('Error signing in after registration:', signInError)
            throw signInError
          }

          console.log('User signed in successfully')
          router.push('/')
        }
      } else {
        console.log('Attempting to sign in')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          console.error('Error signing in:', error)
          throw error
        }
        console.log('User signed in successfully')
        router.push('/')
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
        {cooldown > 0 && (
          <p className="text-yellow-500 mb-4">Please wait {cooldown} seconds before attempting to register again.</p>
        )}
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
          disabled={loading || (isRegistering && cooldown > 0)}
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