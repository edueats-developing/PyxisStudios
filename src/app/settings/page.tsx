'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface Restaurant {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  type: 'restaurant' | 'convenience' | null;
  categories: string[];
}

const RESTAURANT_CATEGORIES = [
  'Japanese', 'Pizza', 'Indian', 'Italian', 'Korean', 
  'Chinese', 'Thai', 'Greek', 'Halal', 'Coffee'
];

const CONVENIENCE_CATEGORIES = [
  'Grocery', 'Convenience', 'Coffee'
];

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [actionCount, setActionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Fetch restaurant data if user is admin
      const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('admin_id', user.id)
        .single()

      if (!error && restaurantData) {
        setRestaurant(restaurantData)
        
        // Calculate action count
        let count = 0
        if (!restaurantData.address) count++
        if (!restaurantData.phone) count++
        if (!restaurantData.type) count++
        if (!restaurantData.categories?.length) count++
        setActionCount(count)
      }
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-6">
        {/* Action Badge */}
        {actionCount > 0 && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {actionCount} action{actionCount > 1 ? 's' : ''} needed to complete your restaurant profile
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Management Section */}
        {restaurant && (
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Restaurant Management</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                {success}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address {!restaurant.address && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={restaurant.address || ''}
                  onChange={async (e) => {
                    const newRestaurant = { ...restaurant, address: e.target.value };
                    setRestaurant(newRestaurant);
                    try {
                      const { error } = await supabase
                        .from('restaurants')
                        .update({ address: e.target.value })
                        .eq('id', restaurant.id);
                      if (error) throw error;
                      setSuccess('Address updated successfully');
                      setTimeout(() => setSuccess(null), 3000);
                    } catch (err: any) {
                      setError(err.message);
                      setTimeout(() => setError(null), 3000);
                    }
                  }}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter restaurant address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number {!restaurant.phone && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="tel"
                  value={restaurant.phone || ''}
                  onChange={async (e) => {
                    const newRestaurant = { ...restaurant, phone: e.target.value };
                    setRestaurant(newRestaurant);
                    try {
                      const { error } = await supabase
                        .from('restaurants')
                        .update({ phone: e.target.value })
                        .eq('id', restaurant.id);
                      if (error) throw error;
                      setSuccess('Phone number updated successfully');
                      setTimeout(() => setSuccess(null), 3000);
                    } catch (err: any) {
                      setError(err.message);
                      setTimeout(() => setError(null), 3000);
                    }
                  }}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Type {!restaurant.type && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={restaurant.type || ''}
                  onChange={async (e) => {
                    const newType = e.target.value as 'restaurant' | 'convenience' | '';
                    const newRestaurant = { ...restaurant, type: newType || null, categories: [] };
                    setRestaurant(newRestaurant);
                    try {
                      const { error } = await supabase
                        .from('restaurants')
                        .update({ 
                          type: newType || null,
                          categories: [] // Reset categories when type changes
                        })
                        .eq('id', restaurant.id);
                      if (error) throw error;
                      setSuccess('Store type updated successfully');
                      setTimeout(() => setSuccess(null), 3000);
                    } catch (err: any) {
                      setError(err.message);
                      setTimeout(() => setError(null), 3000);
                    }
                  }}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select type</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="convenience">Convenience Store</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categories {(!restaurant.categories || !restaurant.categories.length) && <span className="text-red-500">*</span>}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {restaurant.type && (restaurant.type === 'restaurant' ? RESTAURANT_CATEGORIES : CONVENIENCE_CATEGORIES).map((category) => (
                    <label key={category} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={restaurant.categories?.includes(category)}
                        onChange={async (e) => {
                          const newCategories = e.target.checked
                            ? [...(restaurant.categories || []), category]
                            : (restaurant.categories || []).filter(c => c !== category);
                          const newRestaurant = { ...restaurant, categories: newCategories };
                          setRestaurant(newRestaurant);
                          try {
                            const { error } = await supabase
                              .from('restaurants')
                              .update({ categories: newCategories })
                              .eq('id', restaurant.id);
                            if (error) throw error;
                            setSuccess('Categories updated successfully');
                            setTimeout(() => setSuccess(null), 3000);
                          } catch (err: any) {
                            setError(err.message);
                            setTimeout(() => setError(null), 3000);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={restaurant.description || ''}
                  onChange={async (e) => {
                    const newRestaurant = { ...restaurant, description: e.target.value };
                    setRestaurant(newRestaurant);
                    try {
                      const { error } = await supabase
                        .from('restaurants')
                        .update({ description: e.target.value })
                        .eq('id', restaurant.id);
                      if (error) throw error;
                      setSuccess('Description updated successfully');
                      setTimeout(() => setSuccess(null), 3000);
                    } catch (err: any) {
                      setError(err.message);
                      setTimeout(() => setError(null), 3000);
                    }
                  }}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Enter restaurant description"
                />
              </div>
            </div>
          </section>
        )}

        {/* Orders Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Orders</h2>
          <div className="space-y-3">
            <Link href="/order-history" 
                  className="block text-[#00A7A2] hover:text-[#008783]">
              Order History
            </Link>
            <Link href="/order-tracking" 
                  className="block text-[#00A7A2] hover:text-[#008783]">
              Track Orders
            </Link>
          </div>
        </section>

        {/* Account Section */}
        <section className="bg-white p-6 rounded-lg shadow relative">
          {actionCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {actionCount}
            </div>
          )}
          <h2 className="text-xl font-semibold mb-4">Account Management</h2>
          <div className="space-y-3">
            <Link href="/account" 
                  className="block text-[#00A7A2] hover:text-[#008783]">
              Account Settings
            </Link>
            <Link href="/profile" 
                  className="block text-[#00A7A2] hover:text-[#008783]">
              Profile Settings
            </Link>
          </div>
        </section>

        {/* Logout Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </section>
      </div>
    </div>
  )
}
