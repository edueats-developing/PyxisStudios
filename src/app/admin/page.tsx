'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import '../globals.css'
import { useRouter, usePathname } from 'next/navigation'
import RestaurantInfoPopup from '@/components/RestaurantInfoPopup'
import StarRating from '@/components/StarRating'

interface DatabaseReview {
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

interface MenuItem {
  id: number
  name: string
  description: string
  price: string
  category: string
  image_url: string | null
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
}

interface Order {
  id: number
  created_at: string
  total_price: number
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  user_id: string
  items: OrderItem[]
}

interface OrderItem {
  id: number
  menu_item: MenuItem
  quantity: number
  price: number
}

interface AdminDashboardProps {
  user: User
}

function AdminDashboard({ user }: AdminDashboardProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [newItem, setNewItem] = useState<Omit<MenuItem, 'id'>>({ name: '', description: '', price: '', category: '', image_url: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [reviews, setReviews] = useState<DatabaseReview[]>([])
  const pathname = usePathname()

  useEffect(() => {
    fetchRestaurant()
  }, [user.id])

  useEffect(() => {
    if (restaurant) {
      fetchMenuItems()
      fetchOrders()
      fetchReviews()
    }
  }, [restaurant])

  async function fetchRestaurant() {
    try {
      console.log('Fetching restaurant for user:', user.id);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('admin_id', user.id)
        .single();
      
      console.log('Restaurant fetch result:', { 
        data: {
          id: data?.id,
          name: data?.name,
          address: data?.address,
          phone: data?.phone,
          description: data?.description,
          admin_id: data?.admin_id
        }, 
        error 
      });

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

  async function fetchMenuItems() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant!.id)

      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error('Error fetching menu items:', error)
      setError('Failed to load menu items')
    }
  }

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            id,
            quantity,
            price,
            menu_item:menu_items(*)
          )
        `)
        .eq('restaurant_id', restaurant!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders')
    }
  }

  async function addMenuItem(e: React.FormEvent) {
    e.preventDefault()
    try {
      let image_url = null
      if (imageFile) {
        const { data, error } = await supabase.storage
          .from('menu-images')
          .upload(`${restaurant!.id}/${Date.now()}-${imageFile.name}`, imageFile)
        
        if (error) throw error
        
        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(data.path)
        
        image_url = publicUrl
      }

      const { data, error } = await supabase
        .from('menu_items')
        .insert([{ ...newItem, image_url, restaurant_id: restaurant!.id }])

      if (error) throw error
      fetchMenuItems()
      setNewItem({ name: '', description: '', price: '', category: '', image_url: null })
      setImageFile(null)
      setNotification({ message: 'Menu item added successfully', type: 'success' })
    } catch (error) {
      console.error('Error adding menu item:', error)
      setNotification({ message: 'Failed to add menu item', type: 'error' })
    }
  }

  async function deleteMenuItem(id: number) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', restaurant!.id)

      if (error) throw error
      fetchMenuItems()
      setNotification({ message: 'Menu item deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Error deleting menu item:', error)
      setNotification({ message: 'Failed to delete menu item', type: 'error' })
    }
  }

  async function fetchReviews() {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          menu_item:menu_items(name),
          profile:profiles!profile_id(role),
          restaurant:restaurants(name)
        `)
        .or(`restaurant_id.eq.${restaurant!.id},and(menu_item.restaurant_id.eq.${restaurant!.id})`)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  async function updateOrderStatus(orderId: number, newStatus: Order['status']) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .eq('restaurant_id', restaurant!.id)
      
      if (error) throw error
      fetchOrders()
      setNotification({ message: 'Order status updated successfully', type: 'success' })
    } catch (error) {
      console.error('Error updating order status:', error)
      setNotification({ message: 'Failed to update order status', type: 'error' })
    }
  }

  if (loading) {
    return <div className="text-center">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  if (!restaurant) {
    return <div className="text-center text-red-500">No restaurant found for this admin.</div>
  }

  return (
    <div className="p-8 bg-gray-50">
          {/* Restaurant Info Popup */}
          {!loading && restaurant && (
            <RestaurantInfoPopup 
              key={user.id} 
              restaurant={{
                id: restaurant.id,
                name: restaurant.name,
                address: restaurant.address,
                phone: restaurant.phone,
                description: restaurant.description,
                admin_id: restaurant.admin_id
              }}
              onUpdate={fetchRestaurant}
            />
          )}

          {notification && (
            <div className={`p-4 mb-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {notification.message}
            </div>
          )}

          <h1 className="text-2xl font-bold mb-6">Dashboard Overview - {restaurant?.name}</h1>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium">Today's Revenue</h3>
              <p className="text-2xl font-bold mt-2">${orders.reduce((sum, order) => sum + order.total_price, 0).toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium">Total Orders Today</h3>
              <p className="text-2xl font-bold mt-2">{orders.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium">Average Order Value</h3>
              <p className="text-2xl font-bold mt-2">
                ${orders.length > 0 ? (orders.reduce((sum, order) => sum + order.total_price, 0) / orders.length).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-gray-500 text-sm font-medium">Active Menu Items</h3>
              <p className="text-2xl font-bold mt-2">{menuItems.length}</p>
            </div>
          </div>

          {/* Active Orders and Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Active Orders</h2>
                <Link href="/admin/orders" className="text-blue-500 hover:text-blue-700 text-sm">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Recent Feedback</h2>
                <Link href="/admin/feedback" className="text-blue-500 hover:text-blue-700 text-sm">
                  View All
                </Link>
              </div>
              {reviews.length === 0 ? (
                <p className="text-gray-500">No recent feedback</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
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
                      </div>
                      <p className="mt-2 text-gray-700 line-clamp-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Menu Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Menu Overview</h2>
                <Link href="/admin/menu-management" className="text-blue-500 hover:text-blue-700 text-sm">
                  Manage Menu
                </Link>
              </div>
              <div className="space-y-4">
                {menuItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <p className="font-medium">${parseFloat(item.price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
              </div>
              <div className="space-y-4">
                <Link 
                  href="/admin/menu-management"
                  className="block w-full text-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Add New Menu Item
                </Link>
                <Link 
                  href="/admin/orders"
                  className="block w-full text-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  View All Orders
                </Link>
                <Link 
                  href="/admin/analytics"
                  className="block w-full text-center bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          </div>
    </div>
  )
}

export default withAuth(AdminDashboard, ['admin'])
