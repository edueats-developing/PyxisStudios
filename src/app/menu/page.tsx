'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface MenuItem {
  id: number
  name: string
  description: string
  price: string
  category: string
}

interface CartItem extends MenuItem {
  quantity: number
}

export default function Menu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
    fetchMenuItems()
  }, [])

  async function fetchUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error fetching user:', error)
      setError('Failed to fetch user information')
    }
  }

  async function fetchMenuItems() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error('Error fetching menu items:', error)
      setError('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  function addToCart(item: MenuItem) {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      } else {
        return [...prevCart, { ...item, quantity: 1 }]
      }
    })
  }

  function removeFromCart(itemId: number) {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId))
  }

  async function checkout() {
    if (!user) {
      alert('Please log in to place an order')
      return
    }

    try {
      const total = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
      
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ user_id: user.id, total_price: total, status: 'pending' }])
        .select()

      if (orderError) throw orderError

      const orderId = orderData[0].id

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderId,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price)
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      alert('Order placed successfully!')
      setCart([])
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    }
  }

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Menu</h1>
      {user && <p className="mb-4">Welcome, {user.email}</p>}
      
      <input
        type="text"
        placeholder="Search menu items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="border p-4 rounded">
            <h3 className="font-bold">{item.name}</h3>
            <p>{item.description}</p>
            <p className="font-semibold">${item.price}</p>
            <p>Category: {item.category}</p>
            <button
              onClick={() => addToCart(item)}
              className="mt-2 bg-blue-500 text-white p-2 rounded"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Cart</h2>
        {cart.map((item) => (
          <div key={item.id} className="mb-2 flex justify-between items-center">
            <span>{item.name} - ${item.price} x {item.quantity}</span>
            <button
              onClick={() => removeFromCart(item.id)}
              className="bg-red-500 text-white p-1 rounded"
            >
              Remove
            </button>
          </div>
        ))}
        <p className="font-bold">
          Total: ${cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2)}
        </p>
        <button
          onClick={checkout}
          className="mt-4 bg-green-500 text-white p-2 rounded"
          disabled={cart.length === 0}
        >
          Checkout
        </button>
      </div>
    </div>
  )
}