'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'
import { Bar, Line } from 'react-chartjs-2'
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
  ChartData,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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
}

interface OrderItem {
  quantity: number;
  menu_item: MenuItem;
}

interface Order {
  created_at: string;
  total_price: number;
}

interface SupabaseOrderItem {
  quantity: number;
  menu_item: {
    id: number;
    name: string;
  };
}

function Analytics({ user }: AnalyticsProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [timePeriod, setTimePeriod] = useState('daily')
  const [salesData, setSalesData] = useState<{ totalRevenue: number; numberOfOrders: number; averageOrderValue: number }>({ totalRevenue: 0, numberOfOrders: 0, averageOrderValue: 0 })
  const [popularItems, setPopularItems] = useState<{ name: string; count: number }[]>([])
  const [peakOrderTimes, setPeakOrderTimes] = useState<{ hour: number; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          menu_item:menu_items(id, name)
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

    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      }))

    setPeakOrderTimes(sortedHours)
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
    return <div className="text-center">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>
  }

  const popularItemsChartData: ChartData<'bar'> = {
    labels: popularItems.map(item => item.name),
    datasets: [
      {
        label: 'Number of Orders',
        data: popularItems.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  }

  const peakOrderTimesChartData: ChartData<'line'> = {
    labels: peakOrderTimes.map(time => `${time.hour}:00`),
    datasets: [
      {
        label: 'Number of Orders',
        data: peakOrderTimes.map(time => time.count),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Analytics Dashboard - {restaurant?.name}</h1>
      
      <div className="mb-4">
        <label htmlFor="timePeriod" className="mr-2">Time Period:</label>
        <select
          id="timePeriod"
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Total Revenue</h2>
          <p className="text-2xl font-bold">${salesData.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Number of Orders</h2>
          <p className="text-2xl font-bold">{salesData.numberOfOrders}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Average Order Value</h2>
          <p className="text-2xl font-bold">${salesData.averageOrderValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Most Popular Items</h2>
          <Bar data={popularItemsChartData} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Peak Order Times</h2>
          <Line data={peakOrderTimesChartData} />
        </div>
      </div>
    </div>
  )
}

export default withAuth(Analytics, ['admin'])
