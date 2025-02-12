'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'
import { useCart } from '../../components/CartContext'
import AddToCartButton from '../../components/AddToCartButton'
import CheckoutButton from '../../components/CheckoutButton'

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  restaurant_id: number;
}

interface Restaurant {
  id: number;
  name: string;
  description: string;
}

export default function Menu() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { items: cart } = useCart()

  useEffect(() => {
    fetchUser()
    fetchRestaurants()
  }, [])

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuItems(selectedRestaurant)
    }
  }, [selectedRestaurant])

  async function fetchUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error fetching user:', error)
      setError('Failed to fetch user information')
    }
  }

  async function fetchRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      setRestaurants(data || [])
      if (data && data.length > 0) {
        setSelectedRestaurant(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
      setError('Failed to load restaurants')
    }
  }

  async function fetchMenuItems(restaurantId: number) {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
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
      
      <div className="mb-4">
        <label htmlFor="restaurant-select" className="block mb-2">Select Restaurant:</label>
        <select
          id="restaurant-select"
          value={selectedRestaurant || ''}
          onChange={(e) => setSelectedRestaurant(Number(e.target.value))}
          className="w-full p-2 border rounded"
        >
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>
      </div>

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
            <p className="font-semibold">${item.price.toFixed(2)}</p>
            <p>Category: {item.category}</p>
            {item.image_url && (
              <img src={item.image_url} alt={item.name} className="w-full h-70 object-cover mt-2 rounded" style={{ marginBottom: '1rem' }} />
            )}
            <AddToCartButton item={item} />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Cart</h2>
        {cart.map((item) => (
          <div key={item.id} className="mb-2 flex justify-between items-center">
            <span>{item.name} - ${item.price.toFixed(2)} x {item.quantity}</span>
          </div>
        ))}
        <p className="font-bold">
          Total: ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
        </p>
        <CheckoutButton user={user} />
      </div>
    </div>
  )
}
