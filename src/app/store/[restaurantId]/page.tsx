'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { User } from '@supabase/supabase-js'
import { useCart } from '../../../components/CartContext'
import AddToCartButton from '../../../components/AddToCartButton'
import CheckoutButton from '../../../components/CheckoutButton'
import BackButton from '../../../components/BackButton'
import { useRouter } from 'next/navigation'

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
  average_rating?: number;
  review_count?: number;
}

export default function RestaurantPage({ params }: { params: { restaurantId: string } }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { items: cart } = useCart()
  const router = useRouter()

  useEffect(() => {
    fetchUser()
    fetchRestaurantAndMenu()
  }, [params.restaurantId])

  async function fetchUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error fetching user:', error)
      setError('Failed to fetch user information')
    }
  }

  async function fetchRestaurantAndMenu() {
    try {
      setLoading(true)
      
      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', params.restaurantId)
        .single()
      
      if (restaurantError) throw restaurantError
      
      // Fetch reviews for the restaurant
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('restaurant_id', params.restaurantId)
      
      if (reviewsError) throw reviewsError

      // Calculate average rating and review count
      const reviewCount = reviewsData?.length || 0
      const averageRating = reviewCount > 0
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : 0

      setRestaurant({
        ...restaurantData,
        average_rating: averageRating,
        review_count: reviewCount
      })

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', params.restaurantId)
        .order('name', { ascending: true })
      
      if (menuError) throw menuError
      setMenuItems(menuData || [])
    } catch (error) {
      console.error('Error fetching restaurant data:', error)
      setError('Failed to load restaurant data')
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

  if (error || !restaurant) {
    return <div className="text-center text-red-500">{error || 'Restaurant not found'}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <BackButton onClick={() => router.push('/menu')} />
      
      <h1 className="text-2xl font-bold mb-4">{restaurant.name}</h1>
      <p className="mb-4">{restaurant.description}</p>
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
          <div key={item.id} className="border p-4 rounded shadow-md">
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
