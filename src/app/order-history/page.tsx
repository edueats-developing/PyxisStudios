'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { withAuth } from '@/components/withAuth'

interface MenuItem {
  id: number
  name: string
  price: string
}

interface OrderItem {
  id: number
  menu_item: MenuItem
  quantity: number
  price: number
}

interface Order {
  id: number
  created_at: string
  total_price: number
  status: string
  items: OrderItem[]
}

interface OrderHistoryProps {
  user: User
}

function OrderHistory({ user }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('OrderHistory component mounted, user:', user)
    fetchOrders()
  }, [user])

  async function fetchOrders() {
    console.log('Fetching orders for user:', user)
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            id,
            quantity,
            price,
            menu_item:menu_items(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('Fetched orders:', data)
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load order history')
    } finally {
      setLoading(false)
    }
  }

  console.log('Rendering OrderHistory component, loading:', loading, 'error:', error)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Order History</h1>
      <p className="mb-4">Order history for {user.email}</p>

      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border p-4 rounded">
              <p><strong>Order ID:</strong> {order.id}</p>
              <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
              <p><strong>Total:</strong> ${order.total_price.toFixed(2)}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Items:</strong></p>
              <ul className="list-disc list-inside ml-4">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.menu_item.name} - Quantity: {item.quantity} - Price: ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default withAuth(OrderHistory, ['admin', 'driver', 'customer'])