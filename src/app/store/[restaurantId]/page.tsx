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
import StarRating from '../../../components/StarRating'

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  restaurant_id: number;
  featured?: boolean;
  average_rating?: number;
  review_count?: number;
  menu_item_reviews?: Array<{
    rating: number;
  }>;
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
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([])
  const [mostLikedItems, setMostLikedItems] = useState<MenuItem[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [restaurantReviews, setRestaurantReviews] = useState<any[]>([])
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
      const { data: restaurantReviewsData, error: restaurantReviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profile:profiles!profile_id (
            id,
            role
          )
        `)
        .eq('restaurant_id', params.restaurantId)
        .is('menu_item_id', null)
        .order('created_at', { ascending: false });
      
      if (restaurantReviewsError) throw restaurantReviewsError;

      setRestaurantReviews(restaurantReviewsData || []);

      // Calculate average rating and review count
      const reviewCount = restaurantReviewsData?.length || 0;
      const averageRating = reviewCount > 0
        ? restaurantReviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : 0;

      setRestaurant({
        ...restaurantData,
        average_rating: averageRating,
        review_count: reviewCount
      })

      // Fetch menu items with reviews
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select(`
          *,
          reviews!menu_item_id (
            *,
            profile:profiles!profile_id (
              id,
              role
            )
          )
        `)
        .eq('restaurant_id', params.restaurantId)
        .order('name', { ascending: true });
      
      if (menuError) throw menuError;

      // Process menu items with ratings
      const processedMenuItems = (menuData || []).map(item => {
        const itemReviews = item.reviews || [];
        const ratings = itemReviews.map((r: any) => r.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
          : 0;

        return {
          ...item,
          id: parseInt(item.id as string),
          average_rating: averageRating,
          review_count: ratings.length,
          reviews: itemReviews
        };
      });

      // Set all menu items
      setMenuItems(processedMenuItems);

      // Set featured items
      setFeaturedItems(processedMenuItems.filter(item => item.featured));

      // Set most liked items (top 5 by rating with at least one review)
      setMostLikedItems(
        [...processedMenuItems]
          .filter(item => item.review_count > 0)
          .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
          .slice(0, 5)
      );

      // Get all reviews for menu items
      const allReviews = processedMenuItems.flatMap(item => 
        (item.reviews || []).map((review: any) => ({
          ...review,
          menu_item_name: item.name
        }))
      );
      
      // Sort reviews by date
      setReviews(allReviews.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
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

  // Function to scroll to a section with offset
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 120; // Account for sticky header and navigation
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const stickyHeaderStyle = "text-xl font-bold sticky top-[110px] bg-white py-4 z-[10] border-b mb-4 -mt-4";

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
              <p className="text-gray-600">{restaurant.description}</p>
              {(restaurant.review_count || 0) > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={restaurant.average_rating || 0} />
                  <span className="text-sm text-gray-600">
                    ({restaurant.review_count} reviews)
                  </span>
                </div>
              )}
              {user && <p className="mt-2 text-sm text-gray-500">Welcome, {user.email}</p>}
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              setSearchTerm(searchInput);
            }} className="w-1/3 min-w-[250px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full p-2 pl-10 border rounded-lg"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </form>
          </div>
          {searchTerm && (
            <p className="text-gray-600 mb-4">
              Showing {filteredItems.length} results for "{searchTerm}"
            </p>
          )}
        </div>

        {/* Featured Items Section */}
        {featuredItems.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <h2 className="text-xl font-bold mb-4">Featured Items</h2>
            <div className="grid grid-cols-2 gap-4">
              {featuredItems.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={() => setSelectedItemId(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Most Liked Items Section */}
        {mostLikedItems.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <h2 className="text-xl font-bold mb-4">Most Liked Items</h2>
            <div className="grid grid-cols-2 gap-4">
              {mostLikedItems.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={() => setSelectedItemId(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Menu Categories */}
        <MenuCategories
          categories={[...Array.from(new Set(menuItems.map(item => item.category))), 'Reviews']}
          selectedCategory=""
          onSelectCategory={(category) => {
            const sectionId = category === 'Reviews' ? 'reviews-section' : category;
            scrollToSection(sectionId);
          }}
        />

        {/* Menu Items Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {Array.from(new Set(menuItems.map(item => item.category))).map(category => (
            <div id={category} key={category} className="mb-12">
              <h2 className={stickyHeaderStyle}>
                {category}
              </h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                {menuItems
                  .filter(item => 
                    item.category === category && 
                    (searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(item => (
                    <div key={item.id}>
                      {/* Menu Item Card */}
                      <MenuItemCard
                        item={item}
                        onAddToCart={() => setSelectedItemId(item.id)}
                      />

                      {/* Item Reviews */}
                      {reviews.filter(review => review.menu_item_id === item.id).length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">Reviews</h4>
                          <div className="space-y-3">
                            {reviews
                              .filter(review => review.menu_item_id === item.id)
                              .map(review => (
                                <div key={`${review.menu_item_id}-${review.created_at}`} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm text-gray-500">By: {review.profile.role || 'Anonymous'}</p>
                                    <span className="text-sm text-gray-500">
                                      {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="mb-1">
                                    <StarRating rating={review.rating} />
                                  </div>
                                  <p className="text-sm text-gray-700">{review.comment}</p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Reviews Section */}
        <div id="reviews-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8">
          <h2 className={stickyHeaderStyle}>
            Reviews
          </h2>
          <div>
            {/* Restaurant Reviews */}
            {restaurantReviews.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Restaurant Reviews</h3>
                <div className="space-y-4">
                  {restaurantReviews.map((review: any) => (
                    <div key={`restaurant-${review.created_at}`} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500">By: {review.profile.role || 'Anonymous'}</p>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mb-2">
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Item Reviews */}
            {reviews.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Menu Item Reviews</h3>
                <div className="grid grid-cols-2 gap-4">
                  {reviews.map((review: any) => (
                    <div key={`${review.menu_item_id}-${review.created_at}`} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{review.menu_item_name}</h4>
                          <p className="text-sm text-gray-500">By: {review.profile.role || 'Anonymous'}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mb-2">
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
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

        {selectedItemId && (
          <MenuItemPopup
            item={menuItems.find(item => item.id === selectedItemId)!}
            isOpen={true}
            onClose={() => setSelectedItemId(null)}
          />
        )}
      </div>
    </div>
  )
}
