'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const accountId = searchParams.get('accountId');
  const email = searchParams.get('email');
  const businessName = searchParams.get('businessName');
  const isFromStripe = searchParams.get('source') === 'stripe';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          accountId,
          businessName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          throw new Error('An account with this email already exists');
        }
        throw new Error(data.error || data.details || 'Failed to create account');
      }

      // Store restaurant details for later
      localStorage.setItem('pendingRestaurant', JSON.stringify({
        name: businessName,
        admin_id: data.user.id,
        stripe_account_id: accountId,
        email: email
      }));

      // Show success message instead of immediate redirect
      setIsRegistered(true);

    } catch (error) {
      console.error('Registration error:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create account. Please try again or contact support.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isFromStripe || !email || !businessName || !accountId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
          <p className="text-red-600">Invalid registration link</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Account Created Successfully!</h2>
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">
              We've sent a verification email to <strong>{email}</strong>
            </p>
            <p className="mt-2 text-sm text-green-700">
              Please check your inbox and spam folder. Click the link in the email to verify your account.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Registration</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
            {error.includes('already exists') && (
              <p className="mt-2 text-sm text-red-500">
                Please try logging in instead, or contact support if you need help.
              </p>
            )}
          </div>
        )}

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">
            After registration, we'll send a confirmation link to <strong>{email}</strong>. 
            Please check your inbox and spam folder.
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">
            Creating account for <strong>{businessName}</strong> with email <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email!}
              disabled
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Business Name</label>
            <input
              type="text"
              value={businessName!}
              disabled
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>}>
      <RegisterContent />
    </Suspense>
  );
}
