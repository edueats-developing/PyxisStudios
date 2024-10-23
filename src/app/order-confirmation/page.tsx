'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

interface MenuItem {
  name: string
  price: number
}

interface OrderItem {
  id: string
  menu_item: MenuItem
  quantity: number
  restaurant: {
    id: string
    name: string
  } | null
}

interface Order {
  id: string
  created_at: string
  total_price: number
  status: string
  order_items: OrderItem[]
}

interface GroupedOrderItems {
  [restaurantId: string]: {
    restaurantName: string
    items: OrderItem[]
  }
}

export default function OrderConfirmation() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const orderIds = searchParams.get('orderIds')?.split(',') || []

  useEffect(() => {
    async function fetchOrders() {
      if (orderIds.length === 0) {
        setError('No order IDs provided')
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
            order_items:order_items(
              id,
              quantity,
              menu_item:menu_items(name, price),
              restaurant:restaurants(id, name)
            )
          `)
          .in('id', orderIds)

        if (error) throw error

        if (data) {
          const formattedOrders: Order[] = data.map((order: any) => ({
            id: order.id,
            created_at: order.created_at,
            total_price: order.total_price,
            status: order.status,
            order_items: order.order_items.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              menu_item: {
                name: item.menu_item.name,
                price: item.menu_item.price
              },
              restaurant: item.restaurant ? {
                id: item.restaurant.id,
                name: item.restaurant.name
              } : null
            }))
          }))
          setOrders(formattedOrders)
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
        setError('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [orderIds])

  if (loading) {
    return <div className="text-center">Loading order details...</div>
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  if (orders.length === 0) {
    return <div className="text-center">No orders found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Order Confirmation</h1>
      <p className="mb-2">Thank you for your order!</p>
      {orders.map((order) => {
        const groupedOrderItems: GroupedOrderItems = order.order_items.reduce((acc, item) => {
          const restaurantId = item.restaurant?.id || 'unknown'
          if (!acc[restaurantId]) {
            acc[restaurantId] = {
              restaurantName: item.restaurant?.name || 'Unknown Restaurant',
              items: []
            }
          }
          acc[restaurantId].items.push(item)
          return acc
        }, {} as GroupedOrderItems)

        return (
          <div key={order.id} className="mb-8 border-b pb-4">
            <p className="mb-2">Order ID: {order.id}</p>
            <p className="mb-2">Date: {new Date(order.created_at).toLocaleString()}</p>
            <p className="mb-2">Status: {order.status}</p>
            <h2 className="text-xl font-semibold mt-4 mb-2">Order Items:</h2>
            {Object.entries(groupedOrderItems).map(([restaurantId, { restaurantName, items }]) => (
              <div key={restaurantId} className="mb-4">
                <h3 className="text-lg font-semibold">{restaurantName}</h3>
                <ul>
                  {items.map((item) => (
                    <li key={item.id} className="mb-2">
                      {item.menu_item.name} - Quantity: {item.quantity} - Price: ${(item.menu_item.price * item.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="mt-4 font-bold">Total: ${order.total_price.toFixed(2)}</p>
          </div>
        )
      })}
    </div>
  )
}
