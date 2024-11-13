'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingCompletePage() {
  const router = useRouter();

  useEffect(() => {
    // Add a small delay before redirecting to show the success message
    const timer = setTimeout(() => {
      // Redirect to the dashboard or home page after completion
      router.push('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

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
        <p className="text-gray-600 mb-4">
          Your account has been successfully set up. You can now start accepting payments.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting you to the dashboard...
        </p>
      </div>
    </div>
  );
}
