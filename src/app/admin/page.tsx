'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'

interface MenuItem {
  id: number
  name: string
  description: string
  price: string
  category: string
  image_url: string | null
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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [newItem, setNewItem] = useState<Omit<MenuItem, 'id'>>({ name: '', description: '', price: '', category: '', image_url: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    fetchMenuItems()
    fetchOrders()
  }, [])

  async function fetchMenuItems() {
    try {
      const { data, error } = await supabase.from('menu_items').select('*')
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
        .order('created_at', { ascending: false })
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  async function addMenuItem(e: React.FormEvent) {
    e.preventDefault()
    try {
      let image_url = null
      if (imageFile) {
        const { data, error } = await supabase.storage
          .from('menu-images')
          .upload(`${Date.now()}-${imageFile.name}`, imageFile)
        
        if (error) throw error
        
        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(data.path)
        
        image_url = publicUrl
      }

      const { data, error } = await supabase.from('menu_items').insert([{ ...newItem, image_url }])
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
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-4">Welcome, {user.email}</p>
      
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
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">Add Item</button>
        </form>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Menu Items</h2>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id} className="flex justify-between items-center border p-2 rounded">
              <div>
                <strong>{item.name}</strong> - {item.description} - ${item.price} - {item.category}
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover mt-2" />
                )}
              </div>
              <button 
                onClick={() => deleteMenuItem(item.id)}
                className="bg-red-500 text-white p-1 rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Recent Orders</h2>
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border p-4 rounded">
              <p><strong>Order ID:</strong> {order.id}</p>
              <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
              <p><strong>Total:</strong> ${order.total_price.toFixed(2)}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Items:</strong></p>
              <ul className="list-disc list-inside ml-4">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.menu_item.name} - Quantity: {item.quantity} - Price: ${item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                  className="p-2 border rounded mr-2"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => updateOrderStatus(order.id, order.status)}
                  className="bg-blue-500 text-white p-2 rounded"
                >
                  Update Status
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default withAuth(AdminDashboard, ['admin'])