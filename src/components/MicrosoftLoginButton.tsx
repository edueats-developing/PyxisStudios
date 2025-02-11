'use client'

import { supabase } from '@/lib/supabase';

interface Props {
  onlyForCustomers?: boolean;
  className?: string;
}

const MicrosoftLoginButton: React.FC<Props> = ({ onlyForCustomers = true, className = '' }) => {
  const handleMicrosoftLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email profile',
          queryParams: {
            prompt: 'select_account',
          },
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // The user will be redirected to Microsoft login
      // After successful login, they'll be redirected back to our callback URL
    } catch (error) {
      console.error('Error signing in with Microsoft:', error);
      alert('Failed to sign in with Microsoft. Please try again.');
    }
  };

  return (
    <button
      onClick={handleMicrosoftLogin}
      className={`flex items-center justify-center gap-2 w-full p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"
        />
      </svg>
      <span>Sign in with Microsoft</span>
    </button>
  );
};

export default MicrosoftLoginButton;
