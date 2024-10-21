'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

interface OrderItem {
  id: string
  menu_item: {
    name: string
    price: number
  }
  quantity: number
}

interface Order {
  id: string
  created_at: string
  total_price: number
  status: string
  restaurant: {
    name: string
  }
  order_items: OrderItem[]
}

export default function OrderConfirmation() {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setError('No order ID provided')
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total_price,
            status,
            restaurant:restaurants(name),
            order_items:order_items(
              id,
              quantity,
              menu_item:menu_items(name, price)
            )
          `)
          .eq('id', orderId)
          .single()

        if (error) throw error

        if (data) {
          const formattedOrder: Order = {
            id: data.id,
            created_at: data.created_at,
            total_price: data.total_price,
            status: data.status,
            restaurant: {
              name: data.restaurant[0]?.name || 'Unknown Restaurant'
            },
            order_items: data.order_items.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              menu_item: {
                name: item.menu_item.name,
                price: item.menu_item.price
              }
            }))
          }
          setOrder(formattedOrder)
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        setError('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return <div className="text-center">Loading order details...</div>
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  if (!order) {
    return <div className="text-center">Order not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Order Confirmation</h1>
      <p className="mb-2">Thank you for your order!</p>
      <p className="mb-4">Order ID: {order.id}</p>
      <p className="mb-2">Restaurant: {order.restaurant.name}</p>
      <p className="mb-2">Date: {new Date(order.created_at).toLocaleString()}</p>
      <p className="mb-2">Status: {order.status}</p>
      <h2 className="text-xl font-semibold mt-4 mb-2">Order Items:</h2>
      <ul>
        {order.order_items.map((item) => (
          <li key={item.id} className="mb-2">
            {item.menu_item.name} - Quantity: {item.quantity} - Price: ${(item.menu_item.price * item.quantity).toFixed(2)}
          </li>
        ))}
      </ul>
      <p className="mt-4 font-bold">Total: ${order.total_price.toFixed(2)}</p>
    </div>
  )
}
