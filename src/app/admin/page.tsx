'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import '../globals.css'
import { useRouter, usePathname } from 'next/navigation'
import RestaurantInfoPopup from '@/components/RestaurantInfoPopup'

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
  const pathname = usePathname()

  useEffect(() => {
    fetchRestaurant()
  }, [user.id])

  useEffect(() => {
    if (restaurant) {
      fetchMenuItems()
      fetchOrders()
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
      
      console.log('Restaurant fetch result:', { data, error });

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
    <div className="container mx-auto p-4">
      {/* Only show popup after loading and if restaurant exists */}
      {!loading && restaurant && (
        <RestaurantInfoPopup 
          key={user.id} 
          restaurant={restaurant}
        />
      )}
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard - {restaurant.name}</h1>
      <p className="mb-4">Welcome, {user.email}</p>
      
      <Link href="../menu" className={`AdminDashboard-link ${pathname === '/menu' ? 'AdminDashboard-link-active' : ''}`}>
        Menu
      </Link>
      {notification && (
        <div className={`p-4 mb-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}
      <Link href="/admin/orders" className={`AdminDashboard-link ${pathname === '/orders' ? 'AdminDashboard-link-active' : ''}`}>
        Orders
      </Link>
      {notification && (
        <div className={`p-4 mb-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}
      <Link href="/admin/analytics" className={`AdminDashboard-link ${pathname === '/analytics' ? 'AdminDashboard-link-active' : ''}`}>
        Analytics
      </Link>
      
      {notification && (
        <div className={`p-4 mb-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {notification.message}
        </div>
      )}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Add New Menu Item</h2>
        <form onSubmit={addMenuItem} className="space-y-2">
          <input
            type="text"
            placeholder="Name"
            value={newItem.name}
            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={newItem.description}
            onChange={(e) => setNewItem({...newItem, description: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem({...newItem, price: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={newItem.category}
            onChange={(e) => setNewItem({...newItem, category: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
            className="w-full p-2 border rounded"
          />
          <button type="submit" className={`AdminDashboard-link  ? 'AdminDashboard-link-active' : ''}`}>Add Item</button>
        </form>
      </div>
</div>

  )
}

export default withAuth(AdminDashboard, ['admin'])
