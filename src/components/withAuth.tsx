import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

type Role = 'admin' | 'driver' | 'customer'

export function withAuth(WrappedComponent: React.ComponentType<any>, allowedRoles: Role[]) {
  return function AuthComponent(props: any) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
      async function checkAuth() {
        console.log('withAuth - Checking authentication')
        try {
          const { data: { user } } = await supabase.auth.getUser()
          console.log('withAuth - Fetched user:', user)

          if (user) {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single()

            console.log('withAuth - Fetched profile:', profile, 'Error:', error)

            if (error) throw error

            if (profile && allowedRoles.includes(profile.role as Role)) {
              console.log('withAuth - User has required role:', profile.role)
              setUser(user)
            } else {
              console.log('withAuth - User does not have required role')
              throw new Error('Unauthorized')
            }
          } else {
            console.log('withAuth - No user found')
            throw new Error('Not authenticated')
          }
        } catch (error) {
          console.error('Error checking authentication:', error)
          router.push('/login')
        } finally {
          setLoading(false)
        }
      }

      checkAuth()
    }, [router])

    if (loading) {
      return <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }

    if (!user) {
      return null
    }

    return <WrappedComponent {...props} user={user} />
  }
}
