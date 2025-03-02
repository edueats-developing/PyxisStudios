'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'
import BackButton from '@/components/BackButton'
import { ArrowLeftIcon, InformationCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface Restaurant {
  id: number
  name: string
  image_url: string | null
  banner_url: string | null
  profile_url: string | null
}

interface TabProps {
  id: string
  label: string
  icon: JSX.Element
}

const tabs: TabProps[] = [
  { 
    id: 'banner', 
    label: 'Banner Image',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  },
  { 
    id: 'profile', 
    label: 'Profile Image',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  },
  { 
    id: 'restaurant', 
    label: 'Restaurant Image',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  }
];

function DesignPage({ user }: { user: User }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState('banner')
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchRestaurant()
  }, [user.id])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, type: 'main' | 'banner' | 'profile') => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        switch (type) {
          case 'main':
            setImageFile(file)
            break
          case 'banner':
            setBannerFile(file)
            break
          case 'profile':
            setProfileFile(file)
            break
        }
      }
    }
  }, [])

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Design Settings</h1>
              <p className="mt-2 text-gray-600">Customize your restaurant's appearance across the platform</p>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div 
            className={`mb-6 p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-500 ease-in-out ${
              notification.type === 'success' 
                ? 'bg-green-50 border-green-500 text-green-700' 
                : 'bg-red-50 border-red-500 text-red-700'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-[#00A7A2] text-[#00A7A2]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              Live Preview
              <InformationCircleIcon className="w-5 h-5 ml-2 text-gray-400" />
            </h2>

            {activeTab === 'banner' && (
              <div className="space-y-4">
                <div className="aspect-[21/3] rounded-lg overflow-hidden bg-gray-100">
                  {restaurant?.banner_url ? (
                    <img
                      src={restaurant.banner_url}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No banner image
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Recommended size: 1920x275 pixels (21:3 aspect ratio)
                </p>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto">
                  {restaurant?.profile_url ? (
                    <img
                      src={restaurant.profile_url}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No profile image
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Recommended size: 400x400 pixels (1:1 aspect ratio)
                </p>
              </div>
            )}

            {activeTab === 'restaurant' && (
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                  {restaurant?.image_url ? (
                    <img
                      src={restaurant.image_url}
                      alt="Restaurant Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No restaurant image
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Recommended size: 1200x800 pixels (3:2 aspect ratio)
                </p>
              </div>
            )}
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Upload Image</h2>
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, activeTab === 'banner' ? 'banner' : activeTab === 'profile' ? 'profile' : 'main')}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center
                ${isDragging ? 'border-[#00A7A2] bg-[#00A7A2]/5' : 'border-gray-300 hover:border-gray-400'}
                transition-all duration-200 ease-in-out
              `}
            >
              <div className="space-y-4">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <ArrowUpTrayIcon className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500">
                    Drag and drop your image here, or
                  </p>
                  <label className="relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (activeTab === 'banner') setBannerFile(file)
                          else if (activeTab === 'profile') setProfileFile(file)
                          else setImageFile(file)
                        }
                      }}
                      className="sr-only"
                    />
                    <span className="text-[#00A7A2] hover:text-[#008783] font-medium">
                      browse to upload
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={(e) => handleImageUpload(e, activeTab === 'banner' ? 'banner' : activeTab === 'profile' ? 'profile' : 'main')}
                disabled={!(activeTab === 'banner' ? bannerFile : activeTab === 'profile' ? profileFile : imageFile) || loading}
                className={`
                  w-full bg-[#00A7A2] text-white px-4 py-2 rounded-lg
                  hover:bg-[#008783] transition-colors duration-200
                  flex items-center justify-center
                  ${loading || !(activeTab === 'banner' ? bannerFile : activeTab === 'profile' ? profileFile : imageFile)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                  }
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload Image'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(DesignPage, ['admin'])
