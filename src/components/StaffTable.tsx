'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface StaffMember {
  id: string
  profile: {
    id: string
    role: string
    username: string
  }
  role: 'viewer' | 'admin'
  created_at: string
}

interface StaffTableProps {
  restaurantId: number
  onUpdate: () => void
}

export default function StaffTable({ restaurantId, onUpdate }: StaffTableProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [restaurantId])

  const fetchStaff = async () => {
    try {
      const { data: rawData, error } = await supabase
        .from('restaurant_staff')
        .select(`
          id,
          role,
          created_at,
          profile:profiles!inner (
            id,
            role,
            username
          )
        `)
        .eq('restaurant_id', restaurantId)

      if (error) throw error
      
      if (!rawData) {
        setStaff([])
        return
      }

      // Transform and validate the data
      const transformedData: StaffMember[] = rawData.map(item => {
        // Ensure profile is a single object, not an array
        const profile = Array.isArray(item.profile) ? item.profile[0] : item.profile
        
        return {
          id: item.id,
          role: item.role as 'viewer' | 'admin',
          created_at: item.created_at,
          profile: {
            id: profile.id,
            role: profile.role,
            username: profile.username || 'Unknown'
          }
        }
      })

      setStaff(transformedData)
    } catch (err) {
      console.error('Error fetching staff:', err)
      setError('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  const removeStaffMember = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_staff')
        .delete()
        .eq('id', staffId)
        .eq('restaurant_id', restaurantId)

      if (error) throw error
      
      // Refresh the staff list
      fetchStaff()
      onUpdate()
    } catch (err) {
      console.error('Error removing staff member:', err)
      setError('Failed to remove staff member')
    }
  }

  const updateStaffRole = async (staffId: string, newRole: 'viewer' | 'admin') => {
    try {
      const { error } = await supabase
        .from('restaurant_staff')
        .update({ role: newRole })
        .eq('id', staffId)
        .eq('restaurant_id', restaurantId)

      if (error) throw error
      
      // Refresh the staff list
      fetchStaff()
      onUpdate()
    } catch (err) {
      console.error('Error updating staff role:', err)
      setError('Failed to update staff role')
    }
  }

  if (loading) return <div>Loading staff members...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Username
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Added On
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {staff.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{member.profile.username}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={member.role}
                  onChange={(e) => updateStaffRole(member.id, e.target.value as 'viewer' | 'admin')}
                  className="text-sm text-gray-900 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer (View orders only)</option>
                  <option value="admin">Admin (Full access)</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {new Date(member.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => removeStaffMember(member.id)}
                  className="text-red-600 hover:text-red-900 focus:outline-none focus:underline"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
          {staff.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                No staff members found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
