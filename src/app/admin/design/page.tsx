'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'
import BackButton from '@/components/BackButton'

interface Restaurant {
  id: number
  name: string
  image_url: string | null
}

function DesignPage({ user }: { user: User }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchRestaurant()
  }, [user.id])

  async function fetchRestaurant() {
    try {
      // First verify the user is a restaurant admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      if (profile.role !== 'admin') throw new Error('Unauthorized')

      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, image_url')
        .eq('admin_id', user.id)
        .single()

      if (error) throw error
      setRestaurant(data)
    } catch (error) {
      console.error('Error fetching restaurant:', error)
      setError('Failed to load restaurant information')
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!imageFile || !restaurant) return

    try {
      setLoading(true)

      // Upload new image with a unique name
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${restaurant.id}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName)

      // Update restaurant record
      const { data: updateData, error: updateError } = await supabase
        .from('restaurants')
        .update({ image_url: publicUrl })
        .eq('admin_id', user.id)
        .eq('id', restaurant.id)
        .select()

      if (updateError) throw updateError

      // Delete old image if it exists and is different from the new one
      if (restaurant.image_url && restaurant.image_url !== publicUrl) {
        const oldPath = restaurant.image_url.split('restaurant-images/')[1]
        if (oldPath) {
          await supabase.storage
            .from('restaurant-images')
            .remove([oldPath])
        }
      }

      setNotification({ message: 'Restaurant image updated successfully', type: 'success' })
      setRestaurant(updateData[0])
      setImageFile(null)
    } catch (error: any) {
      console.error('Error updating restaurant image:', error)
      setNotification({ 
        message: error.message || 'Failed to update restaurant image', 
        type: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center">Loading...</div>
  if (error) return <div className="text-center text-red-500">{error}</div>
  if (!restaurant) return <div className="text-center text-red-500">No restaurant found for this admin.</div>

  return (
    <div className="container mx-auto p-4">
      <BackButton onClick={() => window.history.back()} />
      
      <h1 className="text-2xl font-bold mb-6">Restaurant Design - {restaurant.name}</h1>

      {notification && (
        <div className={`p-4 mb-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Restaurant Image</h2>
        
        {restaurant.image_url && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Current Image:</p>
            <img 
              src={restaurant.image_url} 
              alt={restaurant.name}
              className="w-full max-w-md h-48 object-cover rounded"
            />
          </div>
        )}

        <form onSubmit={handleImageUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload New Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
              className="w-full p-2 border rounded"
            />
            <p className="mt-1 text-sm text-gray-500">
              This image will be displayed in the restaurant card on the menu page.
            </p>
          </div>

          <button
            type="submit"
            disabled={!imageFile || loading}
            className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors ${
              (!imageFile || loading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Uploading...' : 'Upload Image'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default withAuth(DesignPage, ['admin'])
