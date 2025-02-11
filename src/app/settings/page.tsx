'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
      setUser(user)
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-6">
        {/* Orders Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Orders</h2>
          <div className="space-y-3">
            <Link href="/order-history" 
                  className="block text-[#00A7A2] hover:text-[#008783]">
              Order History
            </Link>
            <Link href="/order-tracking" 
                  className="block text-[#00A7A2] hover:text-[#008783]">
              Track Orders
            </Link>
          </div>
        </section>

        {/* Account Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Account Management</h2>
          <div className="space-y-3">
            <Link href="/account" 
                  className="block text-[#00A7A2] hover:text-[#008783]">
              Account Settings
            </Link>
            <Link href="/profile" 
                  className="block text-[#00A7A2] hover:text-[#008783]">
              Profile Settings
            </Link>
          </div>
        </section>

        {/* Logout Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </section>
      </div>
    </div>
  )
}
