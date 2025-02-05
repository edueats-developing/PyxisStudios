'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'
import StarRating from '../../components/StarRating'

interface FeedbackItem {
  id: number
  name: string
  type: 'restaurant' | 'menu_item' | 'general'
}

interface FeedbackData {
  user_id: string
  profile_id: string  // Added profile_id
  restaurant_id?: number
  menu_item_id?: number
  rating: number
  comment: string
}

interface Restaurant {
  id: number
  name: string
}

interface MenuItem {
  id: number
  name: string
  restaurant_id: number
}

export default function Feedback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [item, setItem] = useState<FeedbackItem | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<string>('general')
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUser()
    fetchRestaurants()
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    
    if (type && id) {
      fetchItem(type, id)
    } else {
      setItem({
        id: 0,
        name: 'General Feedback',
        type: 'general'
      })
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuItems(parseInt(selectedRestaurant))
    } else {
      setMenuItems([])
    }
  }, [selectedRestaurant])

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  async function fetchRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      setRestaurants(data || [])
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    }
  }

  async function fetchMenuItems(restaurantId: number) {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, restaurant_id')
        .eq('restaurant_id', restaurantId)
        .order('name')
      
      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error('Error fetching menu items:', error)
    }
  }

  async function fetchItem(type: string, id: string) {
    try {
      let data
      if (type === 'restaurant') {
        const { data: restaurantData, error } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('id', id)
          .single()
        if (error) throw error
        data = restaurantData
      } else if (type === 'menu_item') {
        const { data: menuItemData, error } = await supabase
          .from('menu_items')
          .select('id, name')
          .eq('id', id)
          .single()
        if (error) throw error
        data = menuItemData
      }

      if (data) {
        setItem({ ...data, type: type as 'restaurant' | 'menu_item' })
      } else {
        setError('Item not found')
      }
    } catch (error) {
      console.error('Error fetching item:', error)
      setError('Failed to load item')
    } finally {
      setLoading(false)
    }
  }

  async function submitFeedback() {
    if (!user) {
      alert('Please log in to submit feedback')
      return
    }

    if (!rating) {
      alert('Please provide a rating')
      return
    }

    if (!comment.trim()) {
      alert('Please provide a comment')
      return
    }

    setSubmitting(true)

    try {
      const feedbackData: FeedbackData = {
        user_id: user.id,
        profile_id: user.id, // Set profile_id to user.id as per schema constraint
        rating: rating,
        comment: comment.trim()
      }

      // Only add restaurant_id or menu_item_id if they are selected
      if (feedbackType === 'restaurant' && selectedRestaurant) {
        feedbackData.restaurant_id = parseInt(selectedRestaurant)
      } else if (feedbackType === 'menu_item' && selectedMenuItem) {
        feedbackData.menu_item_id = parseInt(selectedMenuItem)
        feedbackData.restaurant_id = parseInt(selectedRestaurant)
      } else if (item && item.type !== 'general') {
        if (item.type === 'restaurant') {
          feedbackData.restaurant_id = item.id
        } else if (item.type === 'menu_item') {
          feedbackData.menu_item_id = item.id
        }
      }

      console.log('Submitting feedback:', feedbackData)

      const { error } = await supabase
        .from('reviews')
        .insert(feedbackData)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      alert('Feedback submitted successfully!')
      router.push('/order-history')
    } catch (error: any) {
      console.error('Submission error:', error)
      alert(error.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!item) return <div>No item found</div>




// rest is HTML







  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Leave Feedback</h1>
      
      {item.type === 'general' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Type
            </label>
            <select
              value={feedbackType}
              onChange={(e) => {
                setFeedbackType(e.target.value)
                setSelectedMenuItem('')
                setSelectedRestaurant('')
              }}
              className="w-full p-2 border rounded"
            >
              <option value="general">General Feedback</option>
              <option value="restaurant">Restaurant Feedback</option>
              <option value="menu_item">Menu Item Feedback</option>
            </select>
          </div>

          {(feedbackType === 'restaurant' || feedbackType === 'menu_item') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Restaurant
              </label>
              <select
                value={selectedRestaurant}
                onChange={(e) => {
                  setSelectedRestaurant(e.target.value)
                  setSelectedMenuItem('')
                }}
                className="w-full p-2 border rounded"
              >
                <option value="">Select a restaurant...</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {feedbackType === 'menu_item' && selectedRestaurant && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Menu Item
              </label>
              <select
                value={selectedMenuItem}
                onChange={(e) => setSelectedMenuItem(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select an item...</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {item.type !== 'general' && (
        <p className="mb-4">You are leaving feedback for: {item.name}</p>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating
        </label>
        <StarRating rating={rating} onRatingChange={setRating} editable={true} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comments
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Leave your comment here"
          rows={4}
          required
        />
      </div>

      <button
        onClick={submitFeedback}
        disabled={submitting || !rating || !comment.trim() || 
          (feedbackType === 'menu_item' && (!selectedMenuItem || !selectedRestaurant)) ||
          (feedbackType === 'restaurant' && !selectedRestaurant)}
        className={`w-full p-2 rounded ${
          submitting 
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white transition-colors'
        }`}
      >
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  )
}