'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

interface Order {
  id: string
  created_at: string
  total_price: number
  status: string
  restaurant: {
    name: string
  }
}

export default function AccountPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setError('You must be logged in to view this page')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total_price,
            status,
            restaurant:restaurants(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        const formattedOrders: Order[] = data.map((order: any) => ({
          id: order.id,
          created_at: order.created_at,
          total_price: order.total_price,
          status: order.status,
          restaurant: {
            name: order.restaurant[0]?.name || 'Unknown Restaurant'
          }
        }))

        setOrders(formattedOrders)
      } catch (error) {
        console.error('Error fetching orders:', error)
        setError('Failed to load order history')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  if (loading) {
    return <div className="text-center">Loading order history...</div>
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Account</h1>
      <h2 className="text-xl font-semibold mb-2">Order History</h2>
      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id} className="mb-4 p-4 border rounded">
              <Link href={`/order-confirmation?orderId=${order.id}`} className="text-blue-500 hover:underline">
                <p className="font-semibold">Order ID: {order.id}</p>
              </Link>
              <p>Date: {new Date(order.created_at).toLocaleString()}</p>
              <p>Restaurant: {order.restaurant.name}</p>
              <p>Total: ${order.total_price.toFixed(2)}</p>
              <p>Status: {order.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
