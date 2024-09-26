'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { withAuth } from '@/components/withAuth'

interface Profile {
  id: string
  first_name: string
  last_name: string
  phone: string
  role: 'admin' | 'driver' | 'customer'
}

function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserAndProfile()
  }, [])

  async function fetchUserAndProfile() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Profile page - Fetched user:', user)
      setUser(user)

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        console.log('Profile page - Fetched profile:', profile, 'Error:', error)
        if (error) throw error
        setProfile(profile)
      }
    } catch (error) {
      console.error('Error fetching user and profile:', error)
      setError('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !profile) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
        })
        .eq('id', user.id)

      if (error) throw error
      alert('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

  if (loading) {
    return <div className="text-center">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  if (!user || !profile) {
    return <div className="text-center">User not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="mb-4">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {profile.role}</p>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}</p>
      </div>
      {isEditing ? (
        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label htmlFor="first_name" className="block">First Name:</label>
            <input
              type="text"
              id="first_name"
              value={profile.first_name || ''}
              onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block">Last Name:</label>
            <input
              type="text"
              id="last_name"
              value={profile.last_name || ''}
              onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block">Phone:</label>
            <input
              type="tel"
              id="phone"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">Save Changes</button>
          <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-300 text-gray-800 p-2 rounded ml-2">Cancel</button>
        </form>
      ) : (
        <div>
          <p><strong>First Name:</strong> {profile.first_name || 'Not set'}</p>
          <p><strong>Last Name:</strong> {profile.last_name || 'Not set'}</p>
          <p><strong>Phone:</strong> {profile.phone || 'Not set'}</p>
          <button onClick={() => setIsEditing(true)} className="bg-blue-500 text-white p-2 rounded mt-4">Edit Profile</button>
        </div>
      )}
    </div>
  )
}

export default withAuth(ProfilePage, ['admin', 'driver', 'customer'])