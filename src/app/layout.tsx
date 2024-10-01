'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import './globals.css'

interface Profile {
  id: string
  role: 'admin' | 'driver' | 'customer'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Fetched user:', user)
      setUser(user)

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        console.log('Fetched profile:', profile, 'Error:', error)
        if (!error) {
          setProfile(profile)
        }
      }
    }

    fetchUserAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: Session | null) => {
        console.log('Auth state changed:', event, session)
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

  console.log('Current user:', user)
  console.log('Current profile:', profile)

  const isLandingPage = pathname === '/'

  return (
    <html lang="en">
      <body>
        {!isLandingPage && (
          <nav className="bg-[#00A7A2] p-4 text-white">
            <div className="container mx-auto flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold">
                EduEats
              </Link>
              <div>
                {user ? (
                  <>
                    <Link href="/menu" className="mr-4 hover:text-[#33B8B4]">
                      Menu
                    </Link>
                    <Link href="/order-history" className="mr-4 hover:text-[#33B8B4]">
                      Order History
                    </Link>
                    <Link href="/order-tracking" className="mr-4 hover:text-[#33B8B4]">
                      Track Orders
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link href="/admin" className="mr-4 hover:text-[#33B8B4]">
                        Admin Dashboard
                      </Link>
                    )}
                    {profile?.role === 'driver' && (
                      <Link href="/driver" className="mr-4 hover:text-[#33B8B4]">
                        Driver Dashboard
                      </Link>
                    )}
                    <Link href="/profile" className="mr-4 hover:text-[#33B8B4]">
                      Profile
                    </Link>
                    <button onClick={handleLogout} className="hover:text-[#33B8B4]">
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="hover:text-[#33B8B4]">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}
        <main>{children}</main>
      </body>
    </html>
  )
}
