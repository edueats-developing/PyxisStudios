'use client'

import { Analytics } from '@vercel/analytics/next'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import './globals.css'
import { CartProvider } from '../components/CartContext'
import ShoppingCart from '../components/ShoppingCart'
import Footer from '../components/Footer'
import Image from 'next/image'
import { 
  Cog6ToothIcon, 
  ShoppingCartIcon,
  BookOpenIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  Square3Stack3DIcon,
  ClipboardIcon,
  ChartBarIcon,
  PaintBrushIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface Profile {
  id: string
  role: 'admin' | 'driver' | 'customer'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [actionCount, setActionCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  const fetchRestaurantData = async (userId: string) => {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('admin_id', userId)
      .single()
    
    if (restaurant) {
      let count = 0
      if (!restaurant.address) count++
      if (!restaurant.phone) count++
      if (!restaurant.type) count++
      if (!restaurant.categories?.length) count++
      setActionCount(count)
    }
  }

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (!error) {
          setProfile(profile)
          if (profile.role === 'admin') {
            fetchRestaurantData(user.id)
          }
        }
      }
    }

    fetchUserAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user)
          fetchUserAndProfile()
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isLandingPage = pathname === '/'

  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Analytics />
          {!isLandingPage && (
            <>
              {/* Horizontal Navbar */}
              <nav className="bg-[#00A7A2] bg-opacity-90 backdrop-filter backdrop-blur-lg p-3 text-white sticky top-0 w-full z-50">
                <div className="container mx-auto flex justify-between items-center">
                  <div className="flex items-center">
                    <Image
                      src="/edueats_logo_white.png"
                      alt="EduEats White Logo"
                      width={40}
                      height={40}
                      className="mr-2"
                    />
                    <Link href="/" className="text-2xl font-bold">
                      EduEats
                    </Link>
                  </div>
                  <div className="flex items-center space-x-4">
                    {user ? (
                      <>
                        <Link href="/menu" className={`horizontal-link flex items-center ${pathname === '/menu' ? 'horizontal-link-active' : ''}`}>
                          Menu
                        </Link>
                        <button 
                          onClick={() => setShowCart(!showCart)} 
                          className="horizontal-link flex items-center p-2"
                        >
                          <ShoppingCartIcon className="h-6 w-6" />
                        </button>
                        {profile?.role === 'driver' && (
                          <Link href="/driver" className={`horizontal-link flex items-center ${pathname === '/driver' ? 'horizontal-link-active' : ''}`}>
                            Driver Dashboard
                          </Link>
                        )}
                        <Link 
                          href="/settings" 
                          className={`horizontal-link flex items-center justify-center p-2 relative ${pathname === '/settings' ? 'horizontal-link-active' : ''}`}
                        >
                          {profile?.role === 'admin' ? (
                            <>
                              <Cog6ToothIcon className="h-6 w-6" />
                              {actionCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                  {actionCount}
                                </span>
                              )}
                            </>
                          ) : (
                            <UserIcon className="h-6 w-6" />
                          )}
                        </Link>
                      </>
                    ) : (
                      <Link href="/login" className="horizontal-link">
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              </nav>

              {/* Shopping Cart */}
              {showCart && (
                <div className="fixed top-[3.75rem] right-0 w-96 h-[calc(100vh-3.75rem)] bg-white shadow-lg z-20 overflow-y-auto">
                  <ShoppingCart />
                </div>
              )}

              {/* Vertical Sidebar for Admin or Customer */}
              {(profile?.role === 'admin' || profile?.role === 'customer') && (
                <aside className="bg-white h-[calc(100vh-3.75rem)] fixed top-[3.75rem] left-0 w-64 p-4">
                  <div className="space-y-2">
                    {profile?.role === 'admin' ? (
                      <>
                        <Link href="/admin" className={`sidebar-link ${pathname === '/admin' ? 'sidebar-link-active' : ''}`}>
                          <HomeIcon />
                          Dashboard
                        </Link>
                        <Link href="/admin/menu-management" className={`sidebar-link ${pathname === '/admin/menu-management' ? 'sidebar-link-active' : ''}`}>
                          <Square3Stack3DIcon />
                          Menu Management
                        </Link>
                        <Link href="/admin/orders" className={`sidebar-link ${pathname === '/admin/orders' ? 'sidebar-link-active' : ''}`}>
                          <ClipboardIcon />
                          Orders
                        </Link>
                        <Link href="/admin/analytics" className={`sidebar-link ${pathname === '/admin/analytics' ? 'sidebar-link-active' : ''}`}>
                          <ChartBarIcon />
                          Analytics
                        </Link>
                        <Link href="/admin/design" className={`sidebar-link ${pathname === '/admin/design' ? 'sidebar-link-active' : ''}`}>
                          <PaintBrushIcon />
                          Design
                        </Link>
                        <div className="horizontal-separator"></div>
                        <Link href="/admin/feedback" className={`sidebar-link ${pathname === '/feedback' ? 'sidebar-link-active' : ''}`}>
                          <ChatBubbleLeftRightIcon />
                          Feedback
                        </Link>
                        <Link href="/users" className={`sidebar-link ${pathname === '/users' ? 'sidebar-link-active' : ''}`}>
                          <UsersIcon />
                          Users
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/menu" className={`sidebar-link ${pathname === '/menu' ? 'sidebar-link-active' : ''}`}>
                          <BookOpenIcon />
                          Menu
                        </Link>
                        <Link href="/restaurants" className={`sidebar-link ${pathname === '/restaurants' ? 'sidebar-link-active' : ''}`}>
                          <BuildingStorefrontIcon />
                          Restaurants
                        </Link>
                        <Link href="/convenience" className={`sidebar-link ${pathname === '/convenience' ? 'sidebar-link-active' : ''}`}>
                          <ShoppingBagIcon />
                          Convenience
                        </Link>
                        <Link href="/browse" className={`sidebar-link ${pathname === '/browse' ? 'sidebar-link-active' : ''}`}>
                          <MagnifyingGlassIcon />
                          Browse All
                        </Link>
                      </>
                    )}
                  </div>
                </aside>
              )}

              {/* Separator Line */}
              {(profile?.role === 'admin' || profile?.role === 'customer') && (
                <div className="border-l border-gray-300 h-[calc(100vh-3.75rem)] fixed top-[3.75rem] left-64"></div>
              )}
            </>
          )}

          {/* Main Content */}
          <div className="min-h-screen flex flex-col">
            <main className={`${!isLandingPage && (profile?.role === 'admin' || profile?.role === 'customer') ? 'ml-64' : ''} pt-4 flex-grow`}>
              {children}
            </main>
            {!isLandingPage && <Footer />}
          </div>
        </CartProvider>
      </body>
    </html>
  )
}
