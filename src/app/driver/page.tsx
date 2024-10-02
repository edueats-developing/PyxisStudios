'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'

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
          restaurant:restaurants(id, name),
          items:order_items(
            id,
            quantity,
            menu_item:menu_items(name, price)
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
    return <div className="text-center">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Driver Dashboard</h1>
      <p className="mb-4">Welcome, {user.email}</p>
      
      <h2 className="text-xl font-semibold mb-2">Orders to Deliver</h2>
      {orders.length === 0 ? (
        <p>No orders to deliver at the moment.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border p-4 rounded shadow">
              <p><strong>Order ID:</strong> {order.id}</p>
              <p><strong>Restaurant:</strong> {order.restaurant.name}</p>
              <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
              <p><strong>Total:</strong> ${order.total_price.toFixed(2)}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <h3 className="font-semibold mt-2">Items:</h3>
              <ul className="list-disc list-inside">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.menu_item.name} - Quantity: {item.quantity}
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                    className="bg-blue-500 text-white p-2 rounded mr-2"
                  >
                    Start Delivery
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