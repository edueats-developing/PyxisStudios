'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegistrationSuccessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    try {
      setResendLoading(true);
      setResendSuccess(false);
      setError(null);

      const pendingRestaurantStr = localStorage.getItem('pendingRestaurant');
      if (!pendingRestaurantStr) {
        throw new Error('Registration information not found');
      }

      const pendingRestaurant = JSON.parse(pendingRestaurantStr);
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: pendingRestaurant.email,
        options: {
          emailRedirectTo: `${window.location.origin}/register/success`
        }
      });

      if (resendError) throw resendError;
      setResendSuccess(true);

    } catch (error) {
      console.error('Error resending verification:', error);
      setError(error instanceof Error ? error.message : 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

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

        <h1 className="text-2xl font-bold mb-4">Registration Complete!</h1>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-blue-800 font-medium mb-2">Important:</p>
            <p className="text-gray-600 mb-4">
              A verification email has been sent to your email address. Please check your inbox and spam folder.
            </p>
            <ol className="text-gray-600 text-left list-decimal pl-5 space-y-2">
              <li>Check your email for the verification link</li>
              <li>Click the link to verify your email address</li>
              <li>Return to EduEats and log in with your email and password</li>
              <li>Access your restaurant dashboard to start managing your menu</li>
            </ol>
          </div>
        )}

        <div className="space-y-4">
          {resendSuccess ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
              <p className="text-green-800">Verification email has been resent!</p>
            </div>
          ) : (
            <button
              onClick={handleResendEmail}
              disabled={resendLoading}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          )}

          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Login
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Return to Home
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Need help? Contact our support team at support@edueats.com</p>
          <p className="mt-2">Please check your spam folder if you don't see the verification email.</p>
        </div>
      </div>
    </div>
  );
}
