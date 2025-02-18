import Link from 'next/link'
import Image from 'next/image'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

async function getRestaurants() {
  const supabase = createServerComponentClient({ cookies })
  const { data: restaurants } = await supabase.from('restaurants').select('*')
  return restaurants
}

export default async function Home() {
  const restaurants = await getRestaurants()

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto py-3 px-6 flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src="/edueats_logo.png"
              alt="EduEats Logo"
              width={40}
              height={40}
              className="mr-2"
            />
            <h1 className="text-2xl font-bold text-[#00A7A2]">EduEats</h1>
          </div>
          <Link href="/login" className="bg-[#00A7A2] text-white py-2 px-4 rounded hover:bg-[#008C87] transition duration-300">
            Login
          </Link>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-[#00A7A2] text-white py-20">
          <div className="container mx-auto text-center">
            <Image
              src="/edueats_logo_white.png"
              alt="EduEats White Logo"
              width={300}
              height={300}
              className="mx-auto mb-6"
            />
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to EduEats</h1>
            <p className="text-xl md:text-2xl mb-8">Delicious meals delivered right to your campus!</p>
            <Link href="/menu" className="bg-white text-[#00A7A2] py-2 px-6 rounded-full text-lg font-semibold hover:bg-gray-100 transition duration-300">
              Order Now
            </Link>
          </div>
        </section>

        {/* Restaurants Section */}
        <section className="py-16">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Partner Restaurants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {restaurants?.map((restaurant) => (
                <div key={restaurant.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-2">{restaurant.name}</h3>
                  <p className="text-gray-600 mb-4">{restaurant.description}</p>
                  <Link href={`/menu?restaurant=${restaurant.id}`} className="bg-[#00A7A2] text-white py-2 px-4 rounded hover:bg-[#008C87] transition duration-300">
                    View Menu
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-200 py-16">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose EduEats?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-[#00A7A2] text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p>Get your meals delivered quickly to your dorm or campus location.</p>
              </div>
              <div className="text-center">
                <div className="bg-[#00A7A2] text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Wide Selection</h3>
                <p>Choose from a variety of cuisines and dietary options.</p>
              </div>
              <div className="text-center">
                <div className="bg-[#00A7A2] text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Student Discounts</h3>
                <p>Enjoy special prices and deals exclusively for students.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-[#00A7A2] text-white py-16">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-xl mb-8">Sign up now and get your first meal free!</p>
            <Link href="/login" className="bg-white text-[#00A7A2] py-2 px-6 rounded-full text-lg font-semibold hover:bg-gray-100 transition duration-300">
              Sign Up
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between">
            <div className="w-full md:w-1/3 mb-6 md:mb-0">
              <h3 className="text-xl font-semibold mb-2">EduEats</h3>
              <p>Delicious meals delivered right to your campus!</p>
              <p>Australian Dollars (AUD)</p>
            </div>
            <div className="w-full md:w-1/3 mb-6 md:mb-0">
              <h3 className="text-xl font-semibold mb-2">Quick Links</h3>
              <ul>
                <li><Link href="/about" className="hover:text-[#00A7A2]">About Us</Link></li>
                <li><Link href="/faq" className="hover:text-[#00A7A2]">FAQ</Link></li>
                <li><Link href="/terms" className="hover:text-[#00A7A2]">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-[#00A7A2]">Privacy Policy</Link></li>
              </ul>
            </div>
            <div className="w-full md:w-1/3">
              <h3 className="text-xl font-semibold mb-2">Contact Us</h3>
              <p>Email: support@edueats.com.au</p>
              <p>Phone: 0478880903</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p>&copy; 2025 EduEats All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
