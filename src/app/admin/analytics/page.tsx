'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  ArcElement,
  ChartData,
} from 'chart.js'
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  InformationCircleIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  StarIcon
} from '@heroicons/react/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface AnalyticsProps {
  user: User
}

interface Restaurant {
  id: number;
  name: string;
}

interface MenuItem {
  id: number;
  name: string;
  price: string;
  category: string;
}

interface OrderItem {
  quantity: number;
  menu_item: MenuItem;
}

interface Order {
  created_at: string;
  total_price: number;
  status: string;
}

interface SupabaseOrderItem {
  quantity: number;
  menu_item: {
    id: number;
    name: string;
    price: string;
    category: string;
  };
}

interface CategoryData {
  name: string;
  revenue: number;
  count: number;
}

interface MenuItemView {
  menu_item_id: number;
  view_count: number;
}

interface Review {
  rating: number;
  comment: string;
  created_at: string;
  menu_item_id?: number;
  menu_item?: any; // Using any temporarily to resolve TypeScript errors
}

// Helper function to safely extract menu item name
function getMenuItemName(menuItem: any): string {
  if (!menuItem) return 'Unknown';
  
  // Handle case where menu_item is an array (from database join)
  if (Array.isArray(menuItem)) {
    return menuItem[0]?.name || 'Unknown';
  }
  
  // Handle case where menu_item is an object
  if (typeof menuItem === 'object') {
    return menuItem.name || 'Unknown';
  }
  
  return 'Unknown';
}

function Analytics({ user }: AnalyticsProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [timePeriod, setTimePeriod] = useState('daily')
  const [salesData, setSalesData] = useState<{ totalRevenue: number; numberOfOrders: number; averageOrderValue: number }>({ totalRevenue: 0, numberOfOrders: 0, averageOrderValue: 0 })
  const [popularItems, setPopularItems] = useState<{ name: string; count: number }[]>([])
  const [peakOrderTimes, setPeakOrderTimes] = useState<{ hour: number; count: number }[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [orderStatusData, setOrderStatusData] = useState<{ status: string; count: number }[]>([])
  const [menuItemViews, setMenuItemViews] = useState<MenuItemView[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [topRatedItems, setTopRatedItems] = useState<{ name: string; rating: number }[]>([])
  const [weekdayOrderData, setWeekdayOrderData] = useState<{ day: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Trends (mock data - in a real app, these would be calculated from historical data)
  const [trends, setTrends] = useState({
    revenue: 5.2,
    orders: 3.7,
    average: 1.5
  })

  useEffect(() => {
    fetchRestaurant()
  }, [user.id])

  useEffect(() => {
    if (restaurant) {
      fetchAnalyticsData()
    }
  }, [restaurant, timePeriod])

  async function fetchRestaurant() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('admin_id', user.id)
        .single()

      if (error) throw error
      setRestaurant(data)
    } catch (error) {
      console.error('Error fetching restaurant:', error)
      setError('Failed to load restaurant information')
    }
  }

  async function fetchAnalyticsData() {
    if (!restaurant) return;

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', getStartDate())
        .order('created_at', { ascending: true })

      if (ordersError) throw ordersError

      const totalRevenue = ordersData.reduce((sum: number, order: Order) => sum + order.total_price, 0)
      const averageOrderValue = ordersData.length > 0 ? totalRevenue / ordersData.length : 0

      setSalesData({
        totalRevenue,
        numberOfOrders: ordersData.length,
        averageOrderValue,
      })

      await fetchPopularItems()
      await fetchPeakOrderTimes(ordersData)
      await fetchCategoryData()
      await fetchOrderStatusData(ordersData)
      await fetchMenuItemViews()
      await fetchReviews()
      await fetchWeekdayOrderData(ordersData)

      setLoading(false)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setError('Failed to load analytics data')
    }
  }

  async function fetchPopularItems() {
    if (!restaurant) return;

    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menu_item:menu_items(id, name, price, category)
        `)
        .eq('menu_item.restaurant_id', restaurant.id)

      if (error) throw error

      const typedData = data as unknown as SupabaseOrderItem[];

      const itemCounts: { [key: number]: number } = typedData.reduce((acc: { [key: number]: number }, item: SupabaseOrderItem) => {
        const itemId = item.menu_item.id
        acc[itemId] = (acc[itemId] || 0) + item.quantity
        return acc
      }, {})

      const sortedItems = Object.entries(itemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([itemId, count]) => ({
          name: typedData.find((item: SupabaseOrderItem) => item.menu_item.id === parseInt(itemId))?.menu_item.name || 'Unknown',
          count,
        }))

      setPopularItems(sortedItems)
    } catch (error) {
      console.error('Error fetching popular items:', error)
    }
  }

  async function fetchPeakOrderTimes(ordersData: Order[]) {
    const hourCounts: { [key: number]: number } = ordersData.reduce((acc: { [key: number]: number }, order: Order) => {
      const hour = new Date(order.created_at).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {})

    // Create an array of all hours (0-23) with their counts
    const allHours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourCounts[i] || 0
    }))

    setPeakOrderTimes(allHours)
  }

  async function fetchCategoryData() {
    if (!restaurant) return;

    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menu_item:menu_items(id, name, price, category)
        `)
        .eq('menu_item.restaurant_id', restaurant.id)

      if (error) throw error

      const typedData = data as unknown as SupabaseOrderItem[];
      
      // Group by category
      const categoryMap: { [key: string]: CategoryData } = {}
      
      typedData.forEach(item => {
        const category = item.menu_item.category || 'Uncategorized'
        const price = parseFloat(item.menu_item.price)
        
        if (!categoryMap[category]) {
          categoryMap[category] = { name: category, revenue: 0, count: 0 }
        }
        
        categoryMap[category].revenue += price * item.quantity
        categoryMap[category].count += item.quantity
      })
      
      const categories = Object.values(categoryMap)
      setCategoryData(categories)
    } catch (error) {
      console.error('Error fetching category data:', error)
    }
  }

  async function fetchOrderStatusData(ordersData: Order[]) {
    // Count orders by status
    const statusCounts: { [key: string]: number } = {}
    
    ordersData.forEach(order => {
      const status = order.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      status: formatStatus(status),
      count
    }))
    
    setOrderStatusData(statusData)
  }

  function formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
  }

  async function fetchMenuItemViews() {
    if (!restaurant) return;

    try {
      // First get menu items
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('restaurant_id', restaurant.id)

      if (menuError) throw menuError

      // Then get view counts for these items
      if (menuItems && menuItems.length > 0) {
        const menuItemIds = menuItems.map(item => item.id)
        
        // Note: This is a simplified version since menu_item_views might not have the exact structure
        // In a real app, you'd need to adjust this query based on your actual database schema
        const { data: viewsData, error: viewsError } = await supabase
          .from('menu_item_views')
          .select('menu_item_id')
          .in('menu_item_id', menuItemIds)
          .gte('created_at', getStartDate())

        if (viewsError) throw viewsError

        // Count views manually
        const viewCounts: { [key: number]: number } = {}
        viewsData?.forEach(view => {
          const itemId = view.menu_item_id
          viewCounts[itemId] = (viewCounts[itemId] || 0) + 1
        })
        
        const formattedViewData = Object.entries(viewCounts).map(([itemId, count]) => ({
          menu_item_id: parseInt(itemId),
          view_count: count
        }))

        setMenuItemViews(formattedViewData)
      }
    } catch (error) {
      console.error('Error fetching menu item views:', error)
    }
  }

  async function fetchReviews() {
    if (!restaurant) return;

    try {
      // Get reviews for the restaurant
      const { data: restaurantReviews, error: restaurantError } = await supabase
        .from('reviews')
        .select('rating, comment, created_at')
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', getStartDate())
        .order('created_at', { ascending: false })

      if (restaurantError) throw restaurantError

      // Get reviews for menu items
      const { data: menuItemReviews, error: menuItemError } = await supabase
        .from('reviews')
        .select(`
          rating, 
          comment, 
          created_at,
          menu_item_id,
          menu_item:menu_items(id, name)
        `)
        .eq('restaurant_id', restaurant.id)
        .not('menu_item_id', 'is', null)
        .gte('created_at', getStartDate())
        .order('rating', { ascending: false })

      if (menuItemError) throw menuItemError

      // Combine reviews
      const allReviews = [
        ...(restaurantReviews || []),
        ...(menuItemReviews || [])
      ]

      setReviews(allReviews)

      // Process top rated items
      if (menuItemReviews && menuItemReviews.length > 0) {
        // Group by menu item and calculate average rating
        const itemRatings: { [key: number]: { sum: number; count: number; name: string } } = {}
        
        menuItemReviews.forEach(review => {
          if (review.menu_item_id) {
            const menuItemName = getMenuItemName(review.menu_item);
            
            if (!itemRatings[review.menu_item_id]) {
              itemRatings[review.menu_item_id] = { 
                sum: 0, 
                count: 0, 
                name: menuItemName
              }
            }
            
            itemRatings[review.menu_item_id].sum += review.rating
            itemRatings[review.menu_item_id].count += 1
          }
        })
        
        // Calculate average and sort
        const ratedItems = Object.entries(itemRatings)
          .map(([id, data]) => ({
            name: data.name,
            rating: data.sum / data.count
          }))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5)
        
        setTopRatedItems(ratedItems)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  async function fetchWeekdayOrderData(ordersData: Order[]) {
    // Count orders by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayCounts = Array(7).fill(0)
    
    ordersData.forEach(order => {
      const dayOfWeek = new Date(order.created_at).getDay()
      dayCounts[dayOfWeek]++
    })
    
    const weekdayData = dayNames.map((day, index) => ({
      day,
      count: dayCounts[index]
    }))
    
    setWeekdayOrderData(weekdayData)
  }

  function getStartDate() {
    const now = new Date()
    switch (timePeriod) {
      case 'daily':
        return new Date(now.setDate(now.getDate() - 1)).toISOString()
      case 'weekly':
        return new Date(now.setDate(now.getDate() - 7)).toISOString()
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString()
      default:
        return new Date(now.setDate(now.getDate() - 1)).toISOString()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8 bg-red-50 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    )
  }

  const popularItemsChartData: ChartData<'bar'> = {
    labels: popularItems.map(item => item.name),
    datasets: [
      {
        label: 'Number of Orders',
        data: popularItems.map(item => item.count),
        backgroundColor: 'rgba(0, 167, 162, 0.7)',
        borderColor: 'rgba(0, 167, 162, 1)',
        borderWidth: 1,
      },
    ],
  }

  const peakOrderTimesChartData: ChartData<'line'> = {
    labels: peakOrderTimes.map(time => `${time.hour}:00`),
    datasets: [
      {
        label: 'Number of Orders',
        data: peakOrderTimes.map(time => time.count),
        borderColor: 'rgba(0, 167, 162, 1)',
        backgroundColor: 'rgba(0, 167, 162, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const categoryChartData: ChartData<'pie'> = {
    labels: categoryData.map(cat => cat.name),
    datasets: [
      {
        data: categoryData.map(cat => cat.revenue),
        backgroundColor: [
          'rgba(0, 167, 162, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 99, 132, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const orderStatusChartData: ChartData<'doughnut'> = {
    labels: orderStatusData.map(status => status.status),
    datasets: [
      {
        data: orderStatusData.map(status => status.count),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(0, 167, 162, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const weekdayOrderChartData: ChartData<'bar'> = {
    labels: weekdayOrderData.map(day => day.day),
    datasets: [
      {
        label: 'Orders by Day of Week',
        data: weekdayOrderData.map(day => day.count),
        backgroundColor: 'rgba(0, 167, 162, 0.7)',
        borderColor: 'rgba(0, 167, 162, 1)',
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Analytics Dashboard - <span className="text-[#00A7A2]">{restaurant?.name}</span>
        </h1>
        
        <div className="bg-white p-2 rounded-lg shadow-sm inline-flex">
          <select
            id="timePeriod"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="p-2 border-none rounded-md focus:ring-2 focus:ring-[#00A7A2] focus:outline-none"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#00A7A2] hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Revenue
                </h3>
                <InformationCircleIcon 
                  className="h-4 w-4 ml-1 text-gray-400 cursor-help"
                  title="Total revenue for the selected time period"
                />
              </div>
              <div className="flex items-baseline mt-2">
                <p className="text-2xl font-bold">${salesData.totalRevenue.toFixed(2)}</p>
                <span className={`ml-2 text-sm ${trends.revenue >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {trends.revenue >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                  {Math.abs(trends.revenue)}%
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-[#00A7A2] bg-opacity-10">
              <CurrencyDollarIcon className="h-6 w-6 text-[#00A7A2]" />
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#00A7A2] hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h3 className="text-gray-500 text-sm font-medium">
                  Number of Orders
                </h3>
                <InformationCircleIcon 
                  className="h-4 w-4 ml-1 text-gray-400 cursor-help"
                  title="Total number of orders for the selected time period"
                />
              </div>
              <div className="flex items-baseline mt-2">
                <p className="text-2xl font-bold">{salesData.numberOfOrders}</p>
                <span className={`ml-2 text-sm ${trends.orders >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {trends.orders >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                  {Math.abs(trends.orders)}%
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-[#00A7A2] bg-opacity-10">
              <ShoppingBagIcon className="h-6 w-6 text-[#00A7A2]" />
            </div>
          </div>
        </div>

        {/* Average Order Value Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#00A7A2] hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h3 className="text-gray-500 text-sm font-medium">
                  Average Order Value
                </h3>
                <InformationCircleIcon 
                  className="h-4 w-4 ml-1 text-gray-400 cursor-help"
                  title="Average value per order for the selected time period"
                />
              </div>
              <div className="flex items-baseline mt-2">
                <p className="text-2xl font-bold">${salesData.averageOrderValue.toFixed(2)}</p>
                <span className={`ml-2 text-sm ${trends.average >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {trends.average >= 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                  {Math.abs(trends.average)}%
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-[#00A7A2] bg-opacity-10">
              <ChartBarIcon className="h-6 w-6 text-[#00A7A2]" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Most Popular Items</h2>
          <div className="h-80">
            <Bar data={popularItemsChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Peak Order Times</h2>
          <div className="h-80">
            <Line data={peakOrderTimesChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Charts - Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Revenue by Category</h2>
          <div className="h-80 flex items-center justify-center">
            {categoryData.length > 0 ? (
              <Pie data={categoryChartData} options={{ maintainAspectRatio: false }} />
            ) : (
              <p className="text-gray-500">No category data available</p>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Order Status Distribution</h2>
          <div className="h-80 flex items-center justify-center">
            {orderStatusData.length > 0 ? (
              <Doughnut data={orderStatusChartData} options={{ maintainAspectRatio: false }} />
            ) : (
              <p className="text-gray-500">No order status data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts - Third Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Orders by Day of Week</h2>
          <div className="h-80">
            <Bar data={weekdayOrderChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Top Rated Items</h2>
          {topRatedItems.length > 0 ? (
            <div className="space-y-4">
              {topRatedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center">
                    <span className="mr-2">{item.rating.toFixed(1)}</span>
                    <StarIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">No ratings data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default withAuth(Analytics, ['admin'])
