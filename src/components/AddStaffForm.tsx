'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AddStaffFormProps {
  restaurantId: number
  onSuccess: () => void
}

export default function AddStaffForm({ restaurantId, onSuccess }: AddStaffFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'viewer' | 'admin'>('viewer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }

      // Create new auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: `${username}@staff.edueats.com`,
        password: password,
        options: {
          data: {
            username: username
          }
        }
      })

      if (signUpError) throw signUpError

      if (!authData.user) {
        setError('Failed to create user account')
        return
      }

      // Create profile for the new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            role: 'staff',
            username: username
          }
        ])

      if (profileError) throw profileError

      // Add staff member to restaurant_staff
      const { error: staffError } = await supabase
        .from('restaurant_staff')
        .insert([
          {
            restaurant_id: restaurantId,
            profile_id: authData.user.id,
            role: role,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }
        ])

      if (staffError) throw staffError

      setSuccess(true)
      setUsername('')
      setPassword('')
      setConfirmPassword('')
      setRole('viewer')
      onSuccess()
    } catch (err) {
      console.error('Error adding staff member:', err)
      setError('Failed to add staff member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          minLength={6}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          minLength={6}
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'viewer' | 'admin')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="viewer">Viewer (Can view orders only)</option>
          <option value="admin">Admin (Full access)</option>
        </select>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {success && (
        <div className="text-green-500 text-sm">Staff member added successfully!</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Staff Member'}
      </button>
    </form>
  )
}
