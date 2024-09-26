'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'

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
  user_id: string
  items: OrderItem[]
}

interface DriverDashboardProps {
  user: User
}

function DriverDashboard({ user }: DriverDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
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
        .in('status', ['ready', 'out_for_delivery'])
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

  async function updateOrderStatus(orderId: number, newStatus: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      
      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      setError('Failed to update order status')
    }
  }

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
      <h1 className="text-2xl font-bold mb-4">Driver Dashboard</h1>
      <p className="mb-4">Welcome, {user.email}</p>
      
      <h2 className="text-xl font-semibold mb-2">Orders Ready for Delivery</h2>
      {orders.length === 0 ? (
        <p>No orders available for delivery at the moment.</p>
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
              <div className="mt-2">
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                    className="bg-blue-500 text-white p-2 rounded mr-2"
                  >
                    Mark as Out for Delivery
                  </button>
                )}
                {order.status === 'out_for_delivery' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="bg-green-500 text-white p-2 rounded"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default withAuth(DriverDashboard, ['driver'])