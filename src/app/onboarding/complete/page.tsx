'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const accountId = searchParams.get('accountId');
  const email = searchParams.get('email');
  const businessName = searchParams.get('businessName');

  useEffect(() => {
    if (!accountId || !email || !businessName) {
      console.error('Missing required parameters:', { accountId, email, businessName });
      return;
    }

    // Redirect to registration page with Stripe data
    const params = new URLSearchParams({
      accountId,
      email,
      businessName,
      source: 'stripe'
    });

    router.push(`/register?${params.toString()}`);
  }, [accountId, email, businessName, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Setting up your account...</p>
        <p className="mt-2 text-sm text-gray-500">You will be redirected to complete registration.</p>
      </div>
    </div>
  );
}
