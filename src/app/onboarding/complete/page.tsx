'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Get the account ID and other params from URL
  const accountId = searchParams.get('accountId');
  const email = searchParams.get('email');
  const businessName = searchParams.get('businessName');

  useEffect(() => {
    const completeOnboarding = async () => {
      if (!accountId || !email || !businessName) {
        return;
      }

      try {
        const response = await fetch('/api/complete-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId,
            email,
            businessName,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error('Failed to complete onboarding');
        }
        
        setMessage(data.message || 'Account setup complete! Please check your email.');
      } catch (error) {
        console.error('Error completing onboarding:', error);
        setMessage('There was an error setting up your account. Please contact support.');
      }
    };

    completeOnboarding();
  }, [accountId, email, businessName]);

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
        
        {/* Email confirmation message */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-blue-800 mb-2">Important Next Steps:</p>
          <p className="text-gray-600">
            1. Check your email ({email}) for a confirmation link<br/>
            2. Click the link to set your password<br/>
            3. Use your email and password to log in
          </p>
        </div>
        
        <p className="text-gray-600 mb-6">
          {message || 'Your Stripe account has been successfully set up.'}
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
