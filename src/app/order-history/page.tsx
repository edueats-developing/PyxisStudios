'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { withAuth } from '@/components/withAuth'

interface Order {
  id: number
  created_at: string
  total_price: number
  status: string
  restaurant: {
    id: number
    name: string
  }
  items: OrderItem[]
}

interface OrderItem {
  id: number
  quantity: number
  menu_item: {
    name: string
    price: string
  }
}

function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(id, name),
          items:order_items(
            id,
            quantity,
            menu_item:menu_items(name, price)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load order history')
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
      <h1 className="text-2xl font-bold mb-4">Order History</h1>
      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border p-4 rounded shadow">
              <p><strong>Order ID:</strong> {order.id}</p>
              <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
              <p><strong>Restaurant:</strong> {order.restaurant.name}</p>
              <p><strong>Total:</strong> ${order.total_price.toFixed(2)}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <h3 className="font-semibold mt-2">Items:</h3>
              <ul className="list-disc list-inside">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.menu_item.name} - Quantity: {item.quantity} - Price: ${parseFloat(item.menu_item.price).toFixed(2)}
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

export default withAuth(OrderHistory, ['customer'])