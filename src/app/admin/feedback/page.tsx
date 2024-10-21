'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'
import StarRating from '@/components/StarRating'

interface Review {
  id: number
  user_id: string
  restaurant_id: number
  menu_item_id: number | null
  rating: number
  comment: string
  created_at: string
  menu_item?: {
    name: string
  }
}

interface FeedbackDashboardProps {
  user: User
}

function FeedbackDashboard({ user }: FeedbackDashboardProps) {
  const [restaurantReviews, setRestaurantReviews] = useState<Review[]>([])
  const [menuItemReviews, setMenuItemReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [user.id])

  async function fetchReviews() {
    try {
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('admin_id', user.id)
        .single()

      if (restaurantError) throw restaurantError

      const { data: restaurantReviews, error: restaurantReviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .is('menu_item_id', null)
        .order('created_at', { ascending: false })

      if (restaurantReviewsError) throw restaurantReviewsError

      const { data: menuItemReviews, error: menuItemReviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          menu_item:menu_items(name)
        `)
        .eq('restaurant_id', restaurantData.id)
        .not('menu_item_id', 'is', null)
        .order('created_at', { ascending: false })

      if (menuItemReviewsError) throw menuItemReviewsError

      setRestaurantReviews(restaurantReviews || [])
      setMenuItemReviews(menuItemReviews || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Feedback Dashboard</h1>
      
      <h2 className="text-xl font-semibold mb-2">Restaurant Reviews</h2>
      <div className="space-y-4 mb-8">
        {restaurantReviews.map((review) => (
          <div key={review.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <StarRating rating={review.rating} />
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleString()}
              </span>
            </div>
            <p>{review.comment}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-2">Menu Item Reviews</h2>
      <div className="space-y-4">
        {menuItemReviews.map((review) => (
          <div key={review.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <StarRating rating={review.rating} />
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleString()}
              </span>
            </div>
            {review.menu_item && (
              <p className="font-semibold">{review.menu_item.name}</p>
            )}
            <p>{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default withAuth(FeedbackDashboard, ['admin'])
