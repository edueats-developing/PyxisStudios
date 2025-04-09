'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'
import StarRating from '@/components/StarRating'
import { 
  ChatBubbleLeftIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useDarkMode } from '@/components/DarkModeContext'

type DatabaseReview = {
  id: number
  user_id: string
  profile_id: string
  restaurant_id: number | null
  menu_item_id: number | null
  rating: number
  comment: string
  created_at: string
  menu_item: {
    name: string
    restaurant: {
      name: string
    } | null
  } | null
  restaurant: {
    name: string
  } | null
  profile: {
    id: string
    role: string
  } | null
}

interface Restaurant {
  id: number
  name: string
  description: string | null
  address: string | null
  phone: string | null
  admin_id: string
  created_at: string
  updated_at: string
  type?: 'restaurant' | 'convenience' | null
  categories?: string[]
}

interface FeedbackDashboardProps {
  user: User
}

function FeedbackDashboard({ user }: FeedbackDashboardProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [reviews, setReviews] = useState<DatabaseReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'restaurant' | 'menu_item'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [refreshing, setRefreshing] = useState(false)
  const { darkMode } = useDarkMode()

  useEffect(() => {
    fetchRestaurant()
  }, [user.id])

  useEffect(() => {
    if (restaurant) {
      fetchReviews()
    }
  }, [restaurant])

  async function fetchRestaurant() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('admin_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('No restaurant found for this admin. Please contact support.')
        } else {
          throw error
        }
      } else {
        setRestaurant(data)
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error)
      setError('Failed to load restaurant information')
    } finally {
      setLoading(false)
    }
  }

  async function fetchReviews() {
    setRefreshing(true)
    try {
      // First check if the reviews table exists
      const { data: checkData, error: tableError } = await supabase
        .from('reviews')
        .select('id')
        .limit(1)

      if (tableError && tableError.code === 'PGRST116') {
        console.log('Reviews table does not exist')
        setReviews([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Try to fetch reviews with correct joins
      const { data, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          menu_item:menu_items (
            name,
            restaurant_id,
            restaurant:restaurants (
              name
            )
          ),
          restaurant:restaurants (
            name
          ),
          profile:profiles!profile_id (
            id,
            role
          )
        `)
        .order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError)
        throw reviewsError
      }

      // Filter reviews to only show those related to the admin's restaurant
      const restaurantReviews = (data || []).filter(review => {
        return review.restaurant_id === restaurant!.id || 
               (review.menu_item?.restaurant_id === restaurant!.id)
      })
      setReviews(restaurantReviews)
      setError(null)
    } catch (error: any) {
      console.error('Error in fetchReviews:', error)
      if (error?.code !== 'PGRST116') {
        setError(error?.message || 'Failed to load reviews')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredReviews = reviews.filter(review => {
    switch (filter) {
      case 'restaurant':
        return review.restaurant_id && !review.menu_item_id
      case 'menu_item':
        return review.menu_item_id
      default:
        return true
    }
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'desc'
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else {
      return sortOrder === 'desc'
        ? b.rating - a.rating
        : a.rating - b.rating
    }
  })


  if (loading) {
    return <div className="text-center p-8">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>
  }

  if (!restaurant) {
    return <div className="text-center text-red-500 p-8">No restaurant found for this admin.</div>
  }

  return (
    <div className={`p-8 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Feedback Dashboard - <span className="text-[#00A7A2]">{restaurant?.name}</span>
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchReviews}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow"
          >
            <ArrowPathIcon className={`h-5 w-5 text-[#00A7A2] ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-gray-700 dark:text-gray-300">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md transition-colors ${filter === 'all' ? 'bg-[#00A7A2] text-white' : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('restaurant')}
              className={`px-4 py-2 rounded-md transition-colors ${filter === 'restaurant' ? 'bg-[#00A7A2] text-white' : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Restaurant
            </button>
            <button
              onClick={() => setFilter('menu_item')}
              className={`px-4 py-2 rounded-md transition-colors ${filter === 'menu_item' ? 'bg-[#00A7A2] text-white' : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Menu Items
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'rating')}
              className={`px-3 py-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className={`px-3 py-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} hover:bg-opacity-80`}
            >
              {sortOrder === 'desc' ? '↓ Newest First' : '↑ Oldest First'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Content */}
      {reviews.length === 0 ? (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-sm text-center`}>
          <ChatBubbleLeftIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>No Feedback Yet</h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
            There is no feedback available for your restaurant at this time. Feedback will appear here once customers start submitting reviews.
          </p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-sm text-center`}>
          <ChatBubbleLeftIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>No Matching Feedback</h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
            There is no feedback matching the selected filter. Try selecting a different filter to see other feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div 
              key={review.id} 
              className={`${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'} p-5 rounded-lg shadow-sm hover:shadow transition-all duration-200`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(review.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    By: {review.profile?.role || 'Anonymous'}
                  </span>
                </div>
                <div className="text-right">
                  {review.restaurant && (
                    <p className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Restaurant Review
                    </p>
                  )}
                  {review.menu_item && (
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        Menu Item: {review.menu_item.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <p className={`mt-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default withAuth(FeedbackDashboard, ['admin'])
