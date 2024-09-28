'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { withAuth } from '@/components/withAuth'

interface Order {
  id: number
  created_at: string
  total_price: number
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
}

function OrderTracking() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  async function fetchUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error fetching user:', error)
      setError('Failed to fetch user information')
    }
  }

  async function fetchOrders() {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Order Tracking</h1>
      {orders.length === 0 ? (
        <p>You have no orders to track.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border p-4 rounded">
              <h2 className="text-xl font-semibold">Order #{order.id}</h2>
              <p>Date: {new Date(order.created_at).toLocaleString()}</p>
              <p>Total: ${order.total_price.toFixed(2)}</p>
              <p>Status: {order.status}</p>
              <div className="mt-2 h-2 bg-gray-200 rounded">
                <div 
                  className={`h-full rounded ${
                    order.status === 'pending' ? 'w-1/6 bg-yellow-500' :
                    order.status === 'preparing' ? 'w-2/6 bg-blue-500' :
                    order.status === 'ready' ? 'w-3/6 bg-green-500' :
                    order.status === 'out_for_delivery' ? 'w-4/6 bg-purple-500' :
                    order.status === 'delivered' ? 'w-full bg-green-700' :
                    'w-full bg-red-500'
                  }`}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default withAuth(OrderTracking, ['customer'])