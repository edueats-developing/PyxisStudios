'use client';

import { useRouter } from 'next/navigation';

export default function RegistrationErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
        <div className="mb-4 text-red-500">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-4">Verification Error</h1>

        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">
            There was a problem verifying your email address. This could be because:
          </p>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            <li>The verification link has expired</li>
            <li>The link has already been used</li>
            <li>There was a technical problem</li>
          </ul>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/register')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Return to Home
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Need help? Contact our support team at support@edueats.com
        </p>
      </div>
    </div>
  );
}
