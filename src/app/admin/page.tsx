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
import { 
  CurrencyDollarIcon, 
  ShoppingBagIcon, 
  CalculatorIcon, 
  Square3Stack3DIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon,
  MoonIcon,
  SunIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'

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
  type?: 'restaurant' | 'convenience' | null
  categories?: string[]
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
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today')
  const [darkMode, setDarkMode] = useState<boolean>(false)
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
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('admin_id', user.id)
        .single();

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

  async function fetchReviews() {
    try {
      // First get direct restaurant reviews
      const { data: restaurantReviews, error: restaurantError } = await supabase
        .from('reviews')
        .select(`
          *,
          profile:profiles!profile_id(
            id,
            role
          )
        `)
        .eq('restaurant_id', restaurant!.id)
        .order('created_at', { ascending: false })

      if (restaurantError) throw restaurantError

      // Then get menu item reviews
      const { data: menuItemReviews, error: menuError } = await supabase
        .from('reviews')
        .select(`
          *,
          menu_item:menu_items!inner(
            name,
            restaurant_id
          ),
          profile:profiles!profile_id(
            id,
            role
          )
        `)
        .eq('menu_item.restaurant_id', restaurant!.id)
        .order('created_at', { ascending: false })

      if (menuError) throw menuError

      // Combine and sort all reviews
      const allReviews = [...(restaurantReviews || []), ...(menuItemReviews || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)

      setReviews(allReviews)
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

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Filter orders based on time period
  const getFilteredOrders = () => {
    const now = new Date();
    let filterDate = new Date();
    
    if (timeFilter === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (timeFilter === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    } else {
      filterDate.setHours(0, 0, 0, 0); // Start of today
    }
    
    return orders.filter(order => new Date(order.created_at) >= filterDate);
  };

  const filteredOrders = getFilteredOrders();
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_price, 0);
  const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  
  // Calculate trends (mock data for demonstration)
  const revenueTrend = 5.2; // 5.2% increase
  const ordersTrend = -2.1; // 2.1% decrease
  const avgOrderTrend = 3.7; // 3.7% increase
  const menuItemsTrend = 0; // No change

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
    <div className={`p-8 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* Top Bar with Dark Mode Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Dashboard Overview - <span className="text-[#00A7A2]">{restaurant?.name}</span>
        </h1>
        <button 
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'} transition-colors`}
          aria-label="Toggle dark mode"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
        </button>
      </div>

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
            admin_id: restaurant.admin_id,
            type: restaurant.type || null,
            categories: restaurant.categories || []
          }}
          onUpdate={fetchRestaurant}
        />
      )}

      {notification && (
        <div className={`p-4 mb-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}

      {/* Time Period Filter */}
      <div className="flex mb-6 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm inline-flex">
        <button 
          onClick={() => setTimeFilter('today')}
          className={`px-4 py-2 rounded-md ${timeFilter === 'today' ? 'bg-[#00A7A2] text-white' : darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors`}
        >
          Today
        </button>
        <button 
          onClick={() => setTimeFilter('week')}
          className={`px-4 py-2 rounded-md ${timeFilter === 'week' ? 'bg-[#00A7A2] text-white' : darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors`}
        >
          This Week
        </button>
        <button 
          onClick={() => setTimeFilter('month')}
          className={`px-4 py-2 rounded-md ${timeFilter === 'month' ? 'bg-[#00A7A2] text-white' : darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors`}
        >
          This Month
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} p-6 rounded-lg shadow-md border-l-4 border-[#00A7A2] hover:shadow-lg transition-shadow duration-300`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h3 className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-sm font-medium`}>
                  {timeFilter === 'today' ? "Today's" : timeFilter === 'week' ? "This Week's" : "This Month's"} Revenue
                </h3>
                <InformationCircleIcon 
                  className="h-4 w-4 ml-1 text-gray-400 cursor-help"
                  title={`Total revenue for ${timeFilter === 'today' ? 'today' : timeFilter === 'week' ? 'the past 7 days' : 'the past 30 days'}`}
                />
              </div>
              <div className="flex items-baseline mt-2">
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                <span className={`ml-2 text-sm ${revenueTrend >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {revenueTrend >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                  {Math.abs(revenueTrend)}%
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-[#00A7A2] bg-opacity-20' : 'bg-[#00A7A2] bg-opacity-10'}`}>
              <CurrencyDollarIcon className="h-6 w-6 text-[#00A7A2]" />
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} p-6 rounded-lg shadow-md border-l-4 border-[#00A7A2] hover:shadow-lg transition-shadow duration-300`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h3 className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-sm font-medium`}>
                  Total Orders
                </h3>
                <InformationCircleIcon 
                  className="h-4 w-4 ml-1 text-gray-400 cursor-help"
                  title={`Number of orders for ${timeFilter === 'today' ? 'today' : timeFilter === 'week' ? 'the past 7 days' : 'the past 30 days'}`}
                />
              </div>
              <div className="flex items-baseline mt-2">
                <p className="text-2xl font-bold">{filteredOrders.length}</p>
                <span className={`ml-2 text-sm ${ordersTrend >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {ordersTrend >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                  {Math.abs(ordersTrend)}%
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-[#00A7A2] bg-opacity-20' : 'bg-[#00A7A2] bg-opacity-10'}`}>
              <ShoppingBagIcon className="h-6 w-6 text-[#00A7A2]" />
            </div>
          </div>
        </div>

        {/* Average Order Value Card */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} p-6 rounded-lg shadow-md border-l-4 border-[#00A7A2] hover:shadow-lg transition-shadow duration-300`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h3 className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-sm font-medium`}>
                  Average Order Value
                </h3>
                <InformationCircleIcon 
                  className="h-4 w-4 ml-1 text-gray-400 cursor-help"
                  title="Average value per order"
                />
              </div>
              <div className="flex items-baseline mt-2">
                <p className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</p>
                <span className={`ml-2 text-sm ${avgOrderTrend >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {avgOrderTrend >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                  {Math.abs(avgOrderTrend)}%
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-[#00A7A2] bg-opacity-20' : 'bg-[#00A7A2] bg-opacity-10'}`}>
              <CalculatorIcon className="h-6 w-6 text-[#00A7A2]" />
            </div>
          </div>
        </div>

        {/* Menu Items Card */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} p-6 rounded-lg shadow-md border-l-4 border-[#00A7A2] hover:shadow-lg transition-shadow duration-300`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h3 className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-sm font-medium`}>
                  Active Menu Items
                </h3>
                <InformationCircleIcon 
                  className="h-4 w-4 ml-1 text-gray-400 cursor-help"
                  title="Total number of active menu items"
                />
              </div>
              <div className="flex items-baseline mt-2">
                <p className="text-2xl font-bold">{menuItems.length}</p>
                <span className={`ml-2 text-sm ${menuItemsTrend >= 0 ? 'text-green-500' : menuItemsTrend < 0 ? 'text-red-500' : 'text-gray-500'} flex items-center`}>
                  {menuItemsTrend > 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : 
                   menuItemsTrend < 0 ? <ArrowDownIcon className="h-3 w-3 mr-1" /> : ''}
                  {menuItemsTrend !== 0 ? `${Math.abs(menuItemsTrend)}%` : 'No change'}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${darkMode ? 'bg-[#00A7A2] bg-opacity-20' : 'bg-[#00A7A2] bg-opacity-10'}`}>
              <Square3Stack3DIcon className="h-6 w-6 text-[#00A7A2]" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Orders and Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Active Orders */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <ShoppingBagIcon className="h-5 w-5 mr-2 text-[#00A7A2]" />
              Active Orders
            </h2>
            <Link 
              href="/admin/orders" 
              className={`text-[#00A7A2] hover:text-[#33B8B4] text-sm font-medium transition-colors`}
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {filteredOrders.slice(0, 3).map((order) => (
              <div 
                key={order.id} 
                className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b pb-4 hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded-md transition-colors`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Order #{order.id}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      ${order.total_price.toFixed(2)} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'ready' ? 'bg-green-100 text-green-800' :
                    order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'delivered' ? 'bg-teal-100 text-teal-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="px-3 py-1 bg-[#00A7A2] bg-opacity-10 text-[#00A7A2] rounded-md text-xs font-medium hover:bg-opacity-20 transition-colors"
                  >
                    Prepare
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="px-3 py-1 bg-[#00A7A2] bg-opacity-10 text-[#00A7A2] rounded-md text-xs font-medium hover:bg-opacity-20 transition-colors"
                  >
                    Ready
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                    className="px-3 py-1 bg-[#00A7A2] bg-opacity-10 text-[#00A7A2] rounded-md text-xs font-medium hover:bg-opacity-20 transition-colors"
                  >
                    Deliver
                  </button>
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>
                No active orders for the selected time period
              </p>
            )}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <ChatBubbleLeftIcon className="h-5 w-5 mr-2 text-[#00A7A2]" />
              Recent Feedback
            </h2>
            <Link 
              href="/admin/feedback" 
              className={`text-[#00A7A2] hover:text-[#33B8B4] text-sm font-medium transition-colors`}
            >
              View All
            </Link>
          </div>
          {reviews.length === 0 ? (
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No recent feedback</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div 
                  key={review.id} 
                  className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b pb-4 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded-md transition-colors`}
                >
                  <div className="flex justify-between items-start">
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
                  </div>
                  <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Menu Overview and Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Menu Overview */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Square3Stack3DIcon className="h-5 w-5 mr-2 text-[#00A7A2]" />
              Menu Overview
            </h2>
            <Link 
              href="/admin/menu-management" 
              className={`text-[#00A7A2] hover:text-[#33B8B4] text-sm font-medium transition-colors`}
            >
              Manage Menu
            </Link>
          </div>
          <div className="space-y-4">
            {menuItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.category}</p>
                </div>
                <p className="font-medium">${parseFloat(item.price).toFixed(2)}</p>
              </div>
            ))}
            {menuItems.length === 0 && (
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>
                No menu items available
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="space-y-4">
            <Link 
              href="/admin/menu-management"
              className="block w-full text-center bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors"
            >
              Add New Menu Item
            </Link>
            <Link 
              href="/admin/orders"
              className="block w-full text-center bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors"
            >
              View All Orders
            </Link>
            <Link 
              href="/admin/analytics"
              className="block w-full text-center bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors"
            >
              View Analytics
            </Link>
            <Link 
              href="/admin/design"
              className="block w-full text-center bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors"
            >
              Customize Design
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(AdminDashboard, ['admin'])