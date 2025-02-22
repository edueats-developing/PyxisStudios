'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { User } from '@supabase/supabase-js'
import { useCart } from '../../../components/CartContext'
import MenuItemPopup from '../../../components/MenuItemPopup'
import CheckoutButton from '../../../components/CheckoutButton'
import BackButton from '../../../components/BackButton'
import MenuCategories from '../../../components/MenuCategories'
import MenuItemCard from '../../../components/MenuItemCard'
import { useRouter } from 'next/navigation'

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  restaurant_id: number;
}

interface Restaurant {
  id: number;
  name: string;
  description: string;
  average_rating?: number;
  review_count?: number;
  banner_url?: string;
  profile_url?: string;
}

export default function RestaurantPage({ params }: { params: { restaurantId: string } }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const { items: cart } = useCart()
  const router = useRouter()

  useEffect(() => {
    fetchUser()
    fetchRestaurantAndMenu()
  }, [params.restaurantId])

  async function fetchUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error fetching user:', error)
      setError('Failed to fetch user information')
    }
  }

  async function fetchRestaurantAndMenu() {
    try {
      setLoading(true)
      
      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', params.restaurantId)
        .single()
      
      if (restaurantError) throw restaurantError
      
      // Fetch reviews for the restaurant
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('restaurant_id', params.restaurantId)
      
      if (reviewsError) throw reviewsError

      // Calculate average rating and review count
      const reviewCount = reviewsData?.length || 0
      const averageRating = reviewCount > 0
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : 0

      setRestaurant({
        ...restaurantData,
        average_rating: averageRating,
        review_count: reviewCount
      })

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', params.restaurantId)
        .order('name', { ascending: true })
      
      if (menuError) throw menuError
      
      // Convert string IDs to numbers
      const menuItemsWithNumberIds = (menuData || []).map(item => ({
        ...item,
        id: parseInt(item.id as string)
      }))
      setMenuItems(menuItemsWithNumberIds)
    } catch (error) {
      console.error('Error fetching restaurant data:', error)
      setError('Failed to load restaurant data')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  }

  if (error || !restaurant) {
    return <div className="text-center text-red-500">{error || 'Restaurant not found'}</div>
  }

  return (
    <div className="min-h-screen bg-white-100">
      <div className="max-w-6xl mx-auto">

      {/* Back button Section */}
      <div className="pt-2 pl-2 mb-2">
            <BackButton onClick={() => router.push('/menu')} />
          </div>

          {/* Banner and Profile Section */}
        <div className="relative w-full aspect-[21/3] h-auto rounded-lg">
          <img
            src={restaurant.banner_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/restaurant_banner-image/restaurants/default-banner.jpg`}
            alt="Restaurant Banner"
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute -bottom-10 left-8">
            <div className="relative w-[15%] aspect-square min-w-[120px] max-w-[140px] rounded-full border-4 border-grey overflow-hidden bg-white">
              <img
                src={restaurant.profile_url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/restaurant_profile-image/restaurants/default-profile.jpg`}
                alt="Restaurant Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20">
        {/* Restaurant Info and Search Bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
          <p className="mb-4 text-gray-600">{restaurant.description}</p>
          {user && <p className="mb-4 text-sm text-gray-500">Welcome, {user.email}</p>}
        
          <form onSubmit={(e) => {
            e.preventDefault();
            setSearchTerm(searchInput);
          }} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#00A7A2] text-white rounded-lg hover:bg-[#33B8B4]"
              >
                Search
              </button>
            </div>
          </form>
          {searchTerm && (
            <p className="text-gray-600 mb-4">
              Showing {filteredItems.length} results for "{searchTerm}"
            </p>
          )}
        </div>

        {/* Menu Layout */}
        <div className="flex max-w-6xl mx-auto">
          {/* Left Sidebar - Categories */}
          <div className="w-64 flex-shrink-0">
            <MenuCategories
              categories={Array.from(new Set(menuItems.map(item => item.category)))}
              selectedCategory={searchTerm}
              onSelectCategory={setSearchTerm}
            />
          </div>

          {/* Main Content - Menu Items */}
          <div className="flex-1 px-8">
            {Array.from(new Set(menuItems.map(item => item.category))).map(category => (
              <div id={category} key={category} className="mb-8">
                <h2 className="text-xl font-bold sticky top-0 bg-white py-4 z-10 border-b mb-4">
                  {category}
                </h2>
                <div className="space-y-4">
                  {menuItems
                    .filter(item => item.category === category)
                    .filter(item => 
                      searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
                    )
                    .map(item => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddToCart={() => setSelectedItemId(item.id)}
                      />
                    ))}
                </div>
              </div>
            ))}
            {selectedItemId && (
              <MenuItemPopup
                item={menuItems.find(item => item.id === selectedItemId)!}
                isOpen={true}
                onClose={() => setSelectedItemId(null)}
              />
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8">
          <h2 className="text-xl font-bold mb-2">Cart</h2>
          {cart.map((item) => (
            <div key={item.id} className="mb-2 flex justify-between items-center">
              <span>
                {item.name}
                {item.variant && ` - ${item.variant.name}`}
                {item.addons && item.addons.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {' '}(+ {item.addons.map(addon => addon.name).join(', ')})
                  </span>
                )}
                {' '}- ${item.price.toFixed(2)} x {item.quantity}
              </span>
            </div>
          ))}
          <p className="font-bold">
            Total: ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
          </p>
          <CheckoutButton user={user} />
        </div>
      </div>
    </div>
  )
}
