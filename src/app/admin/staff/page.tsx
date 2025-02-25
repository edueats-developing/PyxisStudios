'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'
import StaffTable from '@/components/StaffTable'
import AddStaffForm from '@/components/AddStaffForm'

interface Restaurant {
  id: number
  name: string
}

interface StaffManagementProps {
  user: User
}

function StaffManagement({ user }: StaffManagementProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchRestaurant()
  }, [user.id])

  async function fetchRestaurant() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('admin_id', user.id)
        .single()

      if (error) throw error
      setRestaurant(data)
    } catch (err) {
      console.error('Error fetching restaurant:', err)
      setError('Failed to load restaurant information')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!restaurant) return <div className="p-8 text-red-500">No restaurant found for this admin.</div>

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {showAddForm ? 'Hide Form' : 'Add Staff Member'}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Add New Staff Member</h2>
            <AddStaffForm
              restaurantId={restaurant.id}
              onSuccess={() => {
                setShowAddForm(false)
              }}
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Current Staff Members</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your restaurant staff and their access levels
            </p>
          </div>
          <StaffTable
            restaurantId={restaurant.id}
            onUpdate={() => {
              // This will be called after successful updates to refresh the table
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default withAuth(StaffManagement, ['admin'])
