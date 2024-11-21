'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Get the account ID from URL params (should be passed from create-connected-account)
  const accountId = searchParams.get('accountId');

  const openDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/create-dashboard-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        console.error('Failed to get dashboard URL');
      }
    } catch (error) {
      console.error('Error opening dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay before showing the success message
    const timer = setTimeout(() => {
      if (!accountId) {
        // If no accountId, redirect to home
        router.push('/');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, accountId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
        <div className="mb-4 text-green-500">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">Onboarding Complete!</h1>
        <p className="text-gray-600 mb-6">
          Your account has been successfully set up. You can now start accepting payments.
        </p>
        
        {accountId && (
          <button
            onClick={openDashboard}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isLoading ? 'Opening Dashboard...' : 'Access Stripe Dashboard'}
          </button>
        )}

        <button
          onClick={() => router.push('/')}
          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
