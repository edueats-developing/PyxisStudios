'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  role: 'admin' | 'driver' | 'customer'
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }
    }

    fetchUserAndProfile()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Welcome to EduEats</h1>
      <div className="text-center max-w-2xl mb-8">
        <p className="mb-4">
          EduEats is a convenient food delivery service designed specifically for students. 
          Order delicious meals from local restaurants and have them delivered right to your school at lunchtime!
        </p>
        <p className="mb-4">
          Our platform connects students, local restaurants, and delivery drivers to create a seamless dining experience.
        </p>
      </div>
      {user ? (
        <div className="flex flex-col items-center">
          <p className="mb-4">Welcome back, {user.email}!</p>
          <div className="flex space-x-4">
            {profile?.role === 'admin' && (
              <Link href="/admin" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Admin Dashboard
              </Link>
            )}
            {profile?.role === 'driver' && (
              <Link href="/driver" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Driver Dashboard
              </Link>
            )}
            <Link href="/menu" className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
              View Menu
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <p className="mb-4">Get started with EduEats today!</p>
          <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Login / Register
          </Link>
        </div>
      )}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <ol className="list-decimal list-inside text-left">
          <li className="mb-2">Browse our menu and select your favorite dishes</li>
          <li className="mb-2">Place your order and choose your delivery time</li>
          <li className="mb-2">Our drivers pick up your food from local restaurants</li>
          <li className="mb-2">Enjoy your meal delivered right to your school!</li>
        </ol>
      </div>
    </div>
  )
}
