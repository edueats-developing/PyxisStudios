import Link from 'next/link'

export default function Footer() {
  return (
    <div className="border-t border-gray-200 mt-auto w-full">
      <div className="px-4 py-16">
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
          <Link 
            href="/onboarding"
            className="hover:text-gray-900 transition-colors"
          >
            Sign up a restaurant
          </Link>
          <Link 
            href="/about"
            className="hover:text-gray-900 transition-colors"
          >
            About Us
          </Link>
          <Link 
            href="/faq"
            className="hover:text-gray-900 transition-colors"
          >
            FAQ
          </Link>
          <Link 
            href="/terms"
            className="hover:text-gray-900 transition-colors"
          >
            Terms of Service
          </Link>
          <Link 
            href="/privacy"
            className="hover:text-gray-900 transition-colors"
          >
            Privacy Policy
          </Link>
          <button 
            className="hover:text-gray-900 transition-colors"
            onClick={() => window.open('mailto:support@edueats.com.au?subject=Feedback')}
          >
            Feedback
          </button>
        </div>
        <div className="text-center mt-4 text-sm text-gray-500">
          © 2025 EduEats
        </div>
      </div>
    </div>
  )
}
