import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col scroll-smooth">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
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
          <nav className="hidden md:flex space-x-4">
            <a href="#features" className="text-[#00A7A2] hover:text-[#008C87]">Features</a>
            <a href="#plans" className="text-[#00A7A2] hover:text-[#008C87]">Subscription Plans</a>
            <a href="#contact" className="text-[#00A7A2] hover:text-[#008C87]">Contact Us</a>
          </nav>
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
              src="/edueats_logo.png"
              alt="EduEats Logo"
              width={100}
              height={100}
              className="mx-auto mb-6"
            />
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to EduEats</h1>
            <p className="text-xl md:text-2xl mb-8">Delicious meals delivered right to your campus!</p>
            <Link href="/menu" className="bg-white text-[#00A7A2] py-2 px-6 rounded-full text-lg font-semibold hover:bg-gray-100 transition duration-300">
              Order Now
            </Link>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">See EduEats in Action</h2>
            <div className="max-w-4xl mx-auto bg-gray-200 rounded-lg shadow-lg p-4">
              <Image
                src="/demo-screenshot.png"
                alt="EduEats App Demo"
                width={1200}
                height={675}
                className="rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16">
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

        {/* Pricing Section */}
        <section id="plans" className="bg-gray-200 py-16">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Subscription Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-semibold mb-4">Basic Plan</h3>
                <p className="text-4xl font-bold mb-4">$29<span className="text-lg font-normal">/month</span></p>
                <ul className="mb-8">
                  <li className="mb-2">✅ 10 meals per month</li>
                  <li className="mb-2">✅ Free delivery</li>
                  <li className="mb-2">✅ Access to standard menu</li>
                </ul>
                <Link href="/login" className="block w-full bg-[#00A7A2] text-white text-center py-2 rounded-full hover:bg-[#008C87] transition duration-300">
                  Choose Plan
                </Link>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8 border-4 border-[#00A7A2]">
                <h3 className="text-2xl font-semibold mb-4">Pro Plan</h3>
                <p className="text-4xl font-bold mb-4">$49<span className="text-lg font-normal">/month</span></p>
                <ul className="mb-8">
                  <li className="mb-2">✅ 20 meals per month</li>
                  <li className="mb-2">✅ Free delivery</li>
                  <li className="mb-2">✅ Access to premium menu</li>
                  <li className="mb-2">✅ Priority ordering</li>
                </ul>
                <Link href="/login" className="block w-full bg-[#00A7A2] text-white text-center py-2 rounded-full hover:bg-[#008C87] transition duration-300">
                  Choose Plan
                </Link>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-semibold mb-4">Ultimate Plan</h3>
                <p className="text-4xl font-bold mb-4">$79<span className="text-lg font-normal">/month</span></p>
                <ul className="mb-8">
                  <li className="mb-2">✅ Unlimited meals</li>
                  <li className="mb-2">✅ Free delivery</li>
                  <li className="mb-2">✅ Access to all menus</li>
                  <li className="mb-2">✅ Priority ordering</li>
                  <li className="mb-2">✅ Exclusive discounts</li>
                </ul>
                <Link href="/login" className="block w-full bg-[#00A7A2] text-white text-center py-2 rounded-full hover:bg-[#008C87] transition duration-300">
                  Choose Plan
                </Link>
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
      <footer id="contact" className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Image
                  src="/edueats_logo.png"
                  alt="EduEats Logo"
                  width={40}
                  height={40}
                  className="mr-2"
                />
                <h3 className="text-xl font-semibold">EduEats</h3>
              </div>
              <p>Email: support@edueats.org</p>
              <p>Phone: (123) 456-7890</p>
              <p>Address: 123 Campus Drive, College Town, ST 12345</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <ul>
                <li><Link href="/about" className="hover:text-[#00A7A2]">About Us</Link></li>
                <li><Link href="/faq" className="hover:text-[#00A7A2]">FAQ</Link></li>
                <li><Link href="/terms" className="hover:text-[#00A7A2]">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-[#00A7A2]">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="https://www.youtube.com/@EduEatsAUS" target="_blank" className="hover:text-[#00A7A2]">Youtube</a>
                <a href="https://x.com/EduEats137077" target="_blank" className="hover:text-[#00A7A2]">Twitter</a>
                <a href="https://www.instagram.com/edueats.official/" target="_blank" className="hover:text-[#00A7A2]">Instagram</a>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p>&copy; 2023 EduEats. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
