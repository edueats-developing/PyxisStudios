'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import StarRating from '@/components/StarRating'

interface FeedbackItem {
  id: number
  name: string
  type: 'restaurant' | 'menu_item'
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

  useEffect(() => {
    fetchUser()
    fetchItem()
  }, [])

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  async function fetchItem() {
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      setError('Invalid feedback request')
      setLoading(false)
      return
    }

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
    if (!user || !item) return

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          [item.type === 'restaurant' ? 'restaurant_id' : 'menu_item_id']: item.id,
          rating,
          comment
        })

      if (error) throw error

      alert('Feedback submitted successfully!')
      router.push('/order-history')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Failed to submit feedback')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!item) return <div>No item found</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Leave Feedback</h1>
      <p className="mb-4">You are leaving feedback for: {item.name}</p>
      <div className="mb-4">
        <StarRating rating={rating} onRatingChange={setRating} editable={true} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        placeholder="Leave your comment here"
      />
      <button
        onClick={submitFeedback}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Submit Feedback
      </button>
    </div>
  )
}
