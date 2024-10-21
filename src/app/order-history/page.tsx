'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

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
    id: number
    name: string
    price: number
  }
}

export default function OrderHistory() {
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  async function fetchOrders() {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant:restaurants(id, name),
          items:order_items(
            id,
            quantity,
            menu_item:menu_items(id, name, price)
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

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Order History</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Order #{order.id}</h2>
              <span className="text-sm text-gray-500">
                {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mb-2"><strong>Restaurant:</strong> {order.restaurant.name}</p>
            <p className="mb-2"><strong>Status:</strong> {order.status}</p>
            <p className="mb-2"><strong>Total:</strong> ${order.total_price.toFixed(2)}</p>
            <h3 className="font-semibold mt-2">Items:</h3>
            <ul className="list-disc list-inside">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.menu_item.name} - Quantity: {item.quantity} - Price: ${item.menu_item.price.toFixed(2)}
                </li>
              ))}
            </ul>
            {order.status === 'delivered' && (
              <div className="mt-4">
                <Link href={`/feedback?type=restaurant&id=${order.restaurant.id}`} className="bg-blue-500 text-white p-2 rounded mr-2">
                  Rate Restaurant
                </Link>
                {order.items.map((item) => (
                  <Link key={item.id} href={`/feedback?type=menu_item&id=${item.menu_item.id}`} className="bg-green-500 text-white p-2 rounded mr-2">
                    Rate {item.menu_item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
