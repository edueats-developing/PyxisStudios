'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'
import RestaurantCard from '../../components/RestaurantCard'

interface Restaurant {
  id: number;
  name: string;
  description: string;
  average_rating?: number;
  review_count?: number;
}

export default function Menu() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loadingRestaurants, setLoadingRestaurants] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
    fetchRestaurants()
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

  async function fetchRestaurants() {
    try {
      setLoadingRestaurants(true)
      
      // First fetch restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name', { ascending: true })
      
      if (restaurantsError) throw restaurantsError

      // Then fetch all reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('restaurant_id, rating')
        .not('restaurant_id', 'is', null)
      
      if (reviewsError) throw reviewsError

      // Calculate average ratings and review counts
      const restaurantsWithRatings = restaurantsData?.map(restaurant => {
        const restaurantReviews = reviewsData?.filter(review => review.restaurant_id === restaurant.id) || []
        const reviewCount = restaurantReviews.length
        const averageRating = reviewCount > 0
          ? restaurantReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
          : 0

        return {
          ...restaurant,
          average_rating: averageRating,
          review_count: reviewCount
        }
      }) || []

      setRestaurants(restaurantsWithRatings)
    } catch (error) {
      console.error('Error fetching restaurants:', error)
      setError('Failed to load restaurants')
    } finally {
      setLoadingRestaurants(false)
    }
  }


  if (loadingRestaurants) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  }

  if (error && !restaurants.length) {
    return <div className="text-center text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Menu</h1>
      {user && <p className="mb-4">Welcome, {user.email}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
          />
        ))}
      </div>
    </div>
  )
}
