'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { withAuth } from '../../../components/withAuth'
import { User } from '@supabase/supabase-js'
import StarRating from '../../../components/StarRating'

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

interface FeedbackDashboardProps {
  user: User
}

function FeedbackDashboard({ user }: FeedbackDashboardProps) {
  const [reviews, setReviews] = useState<DatabaseReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'restaurant' | 'menu_item' | 'general'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    try {
      // First check if the reviews table exists
      const { data: checkData, error: tableError } = await supabase
        .from('reviews')
        .select('id')
        .limit(1)

      console.log('Table check result:', { checkData, tableError })

      // If table doesn't exist, show empty state instead of error
      if (tableError && tableError.code === 'PGRST116') {
        console.log('Reviews table does not exist')
        setReviews([])
        setLoading(false)
        return
      }

      // Try to fetch reviews with correct joins
      const { data, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          menu_item:menu_items (
            name,
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

      console.log('Reviews fetch result:', { data, reviewsError })

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError)
        throw reviewsError
      }

      setReviews(data || [])
      setError(null)
    } catch (error: any) {
      console.error('Error in fetchReviews:', error)
      // Only set error if it's not a missing table error
      if (error?.code !== 'PGRST116') {
        setError(error?.message || 'Failed to load reviews')
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredReviews = reviews.filter(review => {
    switch (filter) {
      case 'restaurant':
        return review.restaurant_id && !review.menu_item_id
      case 'menu_item':
        return review.menu_item_id
      case 'general':
        return !review.restaurant_id && !review.menu_item_id
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

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="text-lg text-gray-600">Loading feedback...</div>
    </div>
  )

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Feedback Dashboard</h1>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'rating')}
              className="px-3 py-2 border rounded"
            >
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 border rounded hover:bg-gray-100"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded transition-colors ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('restaurant')}
            className={`px-4 py-2 rounded transition-colors ${filter === 'restaurant' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Restaurant
          </button>
          <button
            onClick={() => setFilter('menu_item')}
            className={`px-4 py-2 rounded transition-colors ${filter === 'menu_item' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Menu Items
          </button>
          <button
            onClick={() => setFilter('general')}
            className={`px-4 py-2 rounded transition-colors ${filter === 'general' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            General
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Feedback</h3>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={fetchReviews}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Feedback Yet</h3>
          <p className="text-gray-500">
            There is no feedback available at this time. Feedback will appear here once customers start submitting reviews.
          </p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Matching Feedback</h3>
          <p className="text-gray-500">
            There is no feedback matching the selected filter. Try selecting a different filter to see other feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white p-4 rounded shadow hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 mt-1">
                    By: {review.profile?.role || 'Anonymous'}
                  </span>
                </div>
                <div className="text-right">
                  {review.restaurant && (
                    <p className="font-semibold text-blue-600">
                      Restaurant: {review.restaurant.name}
                    </p>
                  )}
                  {review.menu_item && (
                    <div>
                      <p className="font-semibold text-green-600">
                        Menu Item: {review.menu_item.name}
                      </p>
                      {review.menu_item.restaurant && (
                        <p className="text-sm text-gray-600">
                          from {review.menu_item.restaurant.name}
                        </p>
                      )}
                    </div>
                  )}
                  {!review.restaurant && !review.menu_item && (
                    <p className="font-semibold text-gray-600">
                      General Feedback
                    </p>
                  )}
                </div>
              </div>
              
              <p className="mt-2 text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default withAuth(FeedbackDashboard, ['admin'])