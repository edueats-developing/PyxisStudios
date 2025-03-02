'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { 
  ClockIcon, 
  CurrencyDollarIcon, 
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

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
  description: string
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
  const [expandedOrders, setExpandedOrders] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchRestaurant()
  }, [user.id])

  useEffect(() => {
    if (restaurant) {
      fetchMenuItems()
      fetchOrders()
    }
  }, [restaurant])

  const toggleOrderExpanded = (orderId: number) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    )
  }

  const getStatusColor = (status: Order['status']) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'preparing': return 'bg-blue-100 text-blue-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusWidth = (status: Order['status']) => {
    switch(status) {
      case 'pending': return 'w-1/5'
      case 'preparing': return 'w-2/5'
      case 'ready': return 'w-3/5'
      case 'out_for_delivery': return 'w-4/5'
      case 'delivered': return 'w-full'
      case 'cancelled': return 'w-full bg-red-500'
      default: return 'w-0'
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch(status) {
      case 'delivered': 
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'cancelled': 
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

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
    setRefreshing(true)
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
    } finally {
      setRefreshing(false)
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
      
      // Auto-dismiss notification after 3 seconds
      setTimeout(() => {
        setNotification(null)
      }, 3000)
    } catch (error) {
      console.error('Error updating order status:', error)
      setNotification({ message: 'Failed to update order status', type: 'error' })
    }
  }

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter)

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
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Orders - {restaurant.name}</h1>
            <p className="text-gray-600">Manage and track your restaurant orders</p>
          </div>
          <button 
            onClick={fetchOrders} 
            className="flex items-center gap-2 bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-[#008C88] transition-colors"
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 mb-6 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => setStatusFilter('all')} 
            className={`px-4 py-2 rounded-full text-sm font-medium ${statusFilter === 'all' ? 'bg-[#00A7A2] text-white' : 'bg-white text-gray-700 border'}`}
          >
            All Orders
          </button>
          <button 
            onClick={() => setStatusFilter('pending')} 
            className={`px-4 py-2 rounded-full text-sm font-medium ${statusFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setStatusFilter('preparing')} 
            className={`px-4 py-2 rounded-full text-sm font-medium ${statusFilter === 'preparing' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}
          >
            Preparing
          </button>
          <button 
            onClick={() => setStatusFilter('ready')} 
            className={`px-4 py-2 rounded-full text-sm font-medium ${statusFilter === 'ready' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`}
          >
            Ready
          </button>
          <button 
            onClick={() => setStatusFilter('out_for_delivery')} 
            className={`px-4 py-2 rounded-full text-sm font-medium ${statusFilter === 'out_for_delivery' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-800'}`}
          >
            Out for Delivery
          </button>
          <button 
            onClick={() => setStatusFilter('delivered')} 
            className={`px-4 py-2 rounded-full text-sm font-medium ${statusFilter === 'delivered' ? 'bg-green-700 text-white' : 'bg-green-100 text-green-800'}`}
          >
            Delivered
          </button>
          <button 
            onClick={() => setStatusFilter('cancelled')} 
            className={`px-4 py-2 rounded-full text-sm font-medium ${statusFilter === 'cancelled' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800'}`}
          >
            Cancelled
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
            <p className="text-gray-500 mt-2">
              {statusFilter === 'all' 
                ? 'You don\'t have any orders yet.' 
                : `You don't have any ${statusFilter} orders.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div 
                  className="p-4 flex flex-wrap justify-between items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleOrderExpanded(order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-[#00A7A2] text-white rounded-full w-10 h-10 flex items-center justify-center">
                      #{order.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}
                        </span>
                        {getStatusIcon(order.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <CurrencyDollarIcon className="h-4 w-4" />
                          ${order.total_price.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          Customer #{order.user_id.substring(0, 8)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {expandedOrders.includes(order.id) ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getStatusWidth(order.status)} ${
                        order.status === 'cancelled' ? 'bg-red-500' : 'bg-[#00A7A2]'
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedOrders.includes(order.id) && (
                  <div className="p-4 border-t border-gray-100">
                    {/* Order Items */}
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Order Items</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-12 text-sm text-gray-500 mb-2 px-2">
                          <div className="col-span-6">Item</div>
                          <div className="col-span-2 text-center">Quantity</div>
                          <div className="col-span-2 text-center">Price</div>
                          <div className="col-span-2 text-right">Subtotal</div>
                        </div>
                        {order.items.map((item) => (
                          <div key={item.id} className="grid grid-cols-12 py-2 border-t border-gray-200">
                            <div className="col-span-6 font-medium">{item.menu_item.name}</div>
                            <div className="col-span-2 text-center">{item.quantity}</div>
                            <div className="col-span-2 text-center">${parseFloat(item.menu_item.price).toFixed(2)}</div>
                            <div className="col-span-2 text-right">${item.price.toFixed(2)}</div>
                          </div>
                        ))}
                        <div className="grid grid-cols-12 py-2 border-t border-gray-200 font-bold">
                          <div className="col-span-10 text-right">Total:</div>
                          <div className="col-span-2 text-right">${order.total_price.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Status Update */}
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Update Status</h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'pending')}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${
                            order.status === 'pending' 
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }`}
                          disabled={order.status === 'pending'}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${
                            order.status === 'preparing' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                          disabled={order.status === 'preparing'}
                        >
                          Preparing
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${
                            order.status === 'ready' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                          disabled={order.status === 'ready'}
                        >
                          Ready
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${
                            order.status === 'out_for_delivery' 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          }`}
                          disabled={order.status === 'out_for_delivery'}
                        >
                          Out for Delivery
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${
                            order.status === 'delivered' 
                              ? 'bg-green-700 text-white' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                          disabled={order.status === 'delivered'}
                        >
                          Delivered
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${
                            order.status === 'cancelled' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          disabled={order.status === 'cancelled'}
                        >
                          Cancelled
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(AdminDashboard, ['admin'])
