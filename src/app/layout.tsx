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
import Image from 'next/image'
import { Cog6ToothIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'

interface Profile {
  id: string
  role: 'admin' | 'driver' | 'customer'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showCart, setShowCart] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

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
              <nav className="bg-[#00A7A2] p-3 text-white fixed top-0 w-full z-10">
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
                          className={`horizontal-link flex items-center p-2 ${pathname === '/settings' ? 'horizontal-link-active' : ''}`}
                        >
                          <Cog6ToothIcon className="h-6 w-6" />
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
                <div className="fixed top-16 right-0 w-96 h-screen bg-white shadow-lg z-20 overflow-y-auto">
                  <ShoppingCart />
                </div>
              )}

              {/* Vertical Sidebar for Admin */}
              {profile?.role === 'admin' && (
                <aside className="bg-white h-screen fixed top-16 left-0 w-64 p-6">
                  <div className="space-y-4">
                    <Link href="/admin" className={`sidebar-link ${pathname === '/admin' ? 'sidebar-link-active' : ''}`}>
                      Dashboard
                    </Link>
                    <Link href="/admin/menu-management" className={`sidebar-link ${pathname === '/admin/menu-management' ? 'sidebar-link-active' : ''}`}>
                      Menu Management
                    </Link>
                    <Link href="/admin/orders" className={`sidebar-link ${pathname === '/admin/orders' ? 'sidebar-link-active' : ''}`}>
                      Orders
                    </Link>
                    <Link href="/admin/staff" className={`sidebar-link ${pathname === '/admin/staff' ? 'sidebar-link-active' : ''}`}>
                      Staff Management
                    </Link>
                    <Link href="/admin/analytics" className={`sidebar-link ${pathname === '/admin/analytics' ? 'sidebar-link-active' : ''}`}>
                      Analytics
                    </Link>
                    <Link href="/admin/design" className={`sidebar-link ${pathname === '/admin/design' ? 'sidebar-link-active' : ''}`}>
                      Design
                    </Link>
                    <div className="horizontal-separator"></div>
                    <Link href="/admin/feedback" className={`sidebar-link ${pathname === '/admin/feedback' ? 'sidebar-link-active' : ''}`}>
                      Feedback
                    </Link>
                    <Link href="/users" className={`sidebar-link ${pathname === '/users' ? 'sidebar-link-active' : ''}`}>
                      Users
                    </Link>
                  </div>
                </aside>
              )}

              {/* Separator Line */}
              {profile?.role === 'admin' && (
                <div className="border-l border-gray-300 h-full fixed top-16 left-64"></div>
              )}
            </>
          )}

          {/* Main Content */}
          <main className={`${!isLandingPage ? 'mt-16' : ''} ${!isLandingPage && profile?.role === 'admin' ? 'ml-64' : ''}`}>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  )
}
