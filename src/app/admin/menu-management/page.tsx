'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/components/withAuth'
import { User } from '@supabase/supabase-js'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ViewColumnsIcon,
  TableCellsIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

import MenuItemVariantsAddons from '@/components/MenuItemVariantsAddons'
import MenuItemOptionsManager from '@/components/MenuItemOptionsManager'
import MenuTableView from '@/components/MenuTableView'
import MenuGridView from '@/components/MenuGridView'
import MenuItemSlidePanel from '@/components/MenuItemSlidePanel'

interface MenuItem {
  id: number
  name: string
  description: string
  price: string
  category: string
  image_url: string | null
  restaurant_id: number
  featured?: boolean
}

interface Restaurant {
  id: number
  name: string
  description: string | null
  address: string | null
  phone: string | null
  admin_id: string
}

interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

function MenuManagement({ user }: { user: User }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [manageOptionsItemId, setManageOptionsItemId] = useState<number | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch restaurant on component mount
  useEffect(() => {
    fetchRestaurant()
  }, [user.id])

  // Fetch menu items when restaurant is loaded or refresh is triggered
  useEffect(() => {
    if (restaurant) {
      fetchMenuItems()
    }
  }, [restaurant, refreshTrigger])

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notifications])

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
    } finally {
      setLoading(false)
    }
  }

  async function fetchMenuItems() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant!.id)

      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error('Error fetching menu items:', error)
      addNotification('Failed to load menu items', 'error')
    } finally {
      setLoading(false)
    }
  }

  function refreshData() {
    setRefreshTrigger(prev => prev + 1)
  }

  async function deleteMenuItem(id: number) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', restaurant!.id)

      if (error) throw error
      
      // Refresh the menu items
      refreshData()
      addNotification('Menu item deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting menu item:', error)
      addNotification('Failed to delete menu item', 'error')
    }
  }

  async function toggleFeaturedStatus(item: MenuItem) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ featured: !item.featured })
        .eq('id', item.id)
        .eq('restaurant_id', restaurant!.id)

      if (error) throw error
      
      // Refresh the menu items
      refreshData()
      addNotification(
        `Item ${!item.featured ? 'featured' : 'unfeatured'} successfully`, 
        'success'
      )
    } catch (error) {
      console.error('Error updating featured status:', error)
      addNotification('Failed to update featured status', 'error')
    }
  }

  function addNotification(message: string, type: 'success' | 'error' | 'info') {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])
  }

  function dismissNotification(id: string) {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))].filter(Boolean)
  
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredItems = filteredItems.filter(item => item.featured)
  const otherItems = filteredItems.filter(item => !item.featured)
  const sortedItems = [...featuredItems, ...otherItems]

  if (loading && !restaurant) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A7A2]"></div>
    </div>
  )
  
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>
  if (!restaurant) return <div className="text-center p-8 text-red-500">No restaurant found for this admin.</div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Menu Management - {restaurant.name}
          </h1>
          <button
            onClick={() => setIsAddPanelOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00A7A2] hover:bg-[#33B8B4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A7A2]"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add New Item
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 
              notification.type === 'error' ? 'bg-red-100 text-red-800 border-l-4 border-red-500' : 
              'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
            }`}
          >
            <p>{notification.message}</p>
            <button 
              onClick={() => dismissNotification(notification.id)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00A7A2] focus:ring-[#00A7A2] sm:text-sm"
            />
          </div>

          {/* Category filter */}
          <div className="w-full sm:w-1/4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00A7A2] focus:ring-[#00A7A2] sm:text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center space-x-2 border border-gray-200 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid' 
                  ? 'bg-[#00A7A2] text-white' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Grid View"
            >
              <ViewColumnsIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${
                viewMode === 'table' 
                  ? 'bg-[#00A7A2] text-white' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Table View"
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={refreshData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A7A2]"
            title="Refresh"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Featured Items Section (if any) */}
      {featuredItems.length > 0 && viewMode === 'grid' && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Featured Items</h2>
          <MenuGridView
            menuItems={featuredItems}
            onEdit={setEditingItem}
            onDelete={deleteMenuItem}
            onManageOptions={setManageOptionsItemId}
            onToggleFeatured={toggleFeaturedStatus}
          />
        </div>
      )}

      {/* Main content */}
      <div className={viewMode === 'grid' && featuredItems.length > 0 ? 'mt-8' : ''}>
        {viewMode === 'grid' && featuredItems.length > 0 && (
          <h2 className="text-lg font-medium text-gray-900 mb-4">All Menu Items</h2>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00A7A2]"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="mt-2 text-lg font-medium text-gray-900">No menu items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? `No results for "${searchQuery}"` : 'Get started by adding your first menu item'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsAddPanelOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00A7A2] hover:bg-[#33B8B4]"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add New Item
              </button>
            </div>
          </div>
        ) : (
          viewMode === 'table' ? (
            <MenuTableView
              menuItems={sortedItems}
              onEdit={setEditingItem}
              onDelete={deleteMenuItem}
              onManageOptions={setManageOptionsItemId}
              onToggleFeatured={toggleFeaturedStatus}
            />
          ) : (
            <MenuGridView
              menuItems={viewMode === 'grid' && featuredItems.length > 0 ? otherItems : sortedItems}
              onEdit={setEditingItem}
              onDelete={deleteMenuItem}
              onManageOptions={setManageOptionsItemId}
              onToggleFeatured={toggleFeaturedStatus}
            />
          )
        )}
      </div>

      {/* Add/Edit Item Slide Panel */}
      <MenuItemSlidePanel
        isOpen={isAddPanelOpen || editingItem !== null}
        onClose={() => {
          setIsAddPanelOpen(false)
          setEditingItem(null)
        }}
        item={editingItem}
        restaurantId={restaurant.id}
        onSave={() => {
          refreshData()
          addNotification(
            editingItem ? 'Menu item updated successfully' : 'Menu item added successfully',
            'success'
          )
        }}
        categories={Array.from(new Set(menuItems.map(item => item.category))).filter(Boolean)}
      />

      {/* Options Management */}
      {manageOptionsItemId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#00A7A2] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-medium">Manage Item Options</h2>
                <button 
                  onClick={() => setManageOptionsItemId(null)}
                  className="text-white hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <MenuItemOptionsManager 
                  menuItemId={manageOptionsItemId} 
                  onUpdate={() => {
                    addNotification('Options updated successfully', 'success')
                  }}
                />
              </div>
              <div className="sticky bottom-0 bg-gray-50 px-6 py-3 flex justify-end">
                <button
                  onClick={() => setManageOptionsItemId(null)}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#00A7A2] hover:bg-[#33B8B4]"
                >
                  <CheckIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withAuth(MenuManagement, ['admin'])
