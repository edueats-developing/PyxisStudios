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
  banner_url: string | null
  profile_url: string | null
}

function DesignPage({ user }: { user: User }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [profileFile, setProfileFile] = useState<File | null>(null)
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
        .select('id, name, image_url, banner_url, profile_url')
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

  async function handleImageUpload(e: React.FormEvent, type: 'main' | 'banner' | 'profile') {
    e.preventDefault()
    const file = type === 'main' ? imageFile : type === 'banner' ? bannerFile : profileFile
    if (!file || !restaurant) return

    try {
      setLoading(true)

      // Upload new image with a unique name
      const fileExt = file.name.split('.').pop()
      const fileName = `${restaurant.id}_${Date.now()}.${fileExt}`

      // Use different buckets based on image type
      const bucket = type === 'main' ? 'restaurant-images' :
                    type === 'banner' ? 'restaurant_banner-image' :
                    'restaurant_profile-image'

      const filePath = type === 'main' ? fileName : `restaurants/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      // Update restaurant record based on image type
      const updateField = type === 'main' ? 'image_url' : type === 'banner' ? 'banner_url' : 'profile_url'
      const { data: updateData, error: updateError } = await supabase
        .from('restaurants')
        .update({ [updateField]: publicUrl })
        .eq('admin_id', user.id)
        .eq('id', restaurant.id)
        .select()

      if (updateError) throw updateError

      // Delete old image if it exists and is different from the new one
      const oldUrl = type === 'main' ? restaurant.image_url : 
                    type === 'banner' ? restaurant.banner_url : 
                    restaurant.profile_url
      if (oldUrl) {
        const bucket = type === 'main' ? 'restaurant-images' :
                      type === 'banner' ? 'restaurant_banner-image' :
                      'restaurant_profile-image'
        const oldPath = oldUrl.split(`${bucket}/`)[1]
        if (oldPath) {
          await supabase.storage
            .from(bucket)
            .remove([oldPath])
        }
      }

      setNotification({ message: `Restaurant ${type} image updated successfully`, type: 'success' })
      setRestaurant(updateData[0])
      if (type === 'main') setImageFile(null)
      else if (type === 'banner') setBannerFile(null)
      else setProfileFile(null)
    } catch (error: any) {
      console.error(`Error updating restaurant ${type} image:`, error)
      setNotification({ 
        message: error.message || `Failed to update restaurant ${type} image`, 
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

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Banner Image</h2>
          
          {restaurant.banner_url && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Current Banner:</p>
              <div className="relative w-full h-48">
                <img 
                  src={restaurant.banner_url} 
                  alt={`${restaurant.name} Banner`}
                  className="w-full h-full object-cover rounded"
                />
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleImageUpload(e, 'banner')} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload New Banner
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerFile(e.target.files ? e.target.files[0] : null)}
                className="w-full p-2 border rounded"
              />
              <p className="mt-1 text-sm text-gray-500">
                This image will be displayed at the top of your restaurant page.
              </p>
            </div>

            <button
              type="submit"
              disabled={!bannerFile || loading}
              className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors ${
                (!bannerFile || loading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Uploading...' : 'Upload Banner'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Profile Image</h2>
          
          {restaurant.profile_url && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Current Profile:</p>
              <div className="relative w-32 h-32">
                <img 
                  src={restaurant.profile_url} 
                  alt={`${restaurant.name} Profile`}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleImageUpload(e, 'profile')} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload New Profile Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfileFile(e.target.files ? e.target.files[0] : null)}
                className="w-full p-2 border rounded"
              />
              <p className="mt-1 text-sm text-gray-500">
                This image will be displayed as your restaurant's profile picture.
              </p>
            </div>

            <button
              type="submit"
              disabled={!profileFile || loading}
              className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors ${
                (!profileFile || loading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Uploading...' : 'Upload Profile'}
            </button>
          </form>
        </div>

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

          <form onSubmit={(e) => handleImageUpload(e, 'main')} className="space-y-4">
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
    </div>
  )
}

export default withAuth(DesignPage, ['admin'])
