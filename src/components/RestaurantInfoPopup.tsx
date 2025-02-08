'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface RestaurantInfo {
  address: string;
  phone: string;
  description: string;
}

interface RestaurantInfoPopupProps {
  restaurant: {
    id: number;
    address: string | null;
    phone: string | null;
    description: string | null;
    admin_id: string;
  };
}

export default function RestaurantInfoPopup({ restaurant: initialData }: RestaurantInfoPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [info, setInfo] = useState<RestaurantInfo>({
    address: '',
    phone: '',
    description: ''
  });
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    console.log('Initial restaurant data:', initialData);
    const shouldShow = !initialData.address;
    console.log('Should show popup:', shouldShow);
    
    setIsOpen(shouldShow);
    setInfo({
      address: initialData.address || '',
      phone: initialData.phone || '',
      description: initialData.description || ''
    });
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    try {
      console.log('Submitting info:', info);
      const { error: updateError, data } = await supabase
        .from('restaurants')
        .update({
          address: info.address,
          phone: info.phone,
          description: info.description
        })
        .eq('id', initialData.id);

      if (updateError) {
        console.log('Update error:', updateError);
        throw updateError;
      }
      console.log('Update successful:', data);

      setIsOpen(false);
    } catch (error) {
      console.error('Error updating restaurant info:', error);
      setError('Failed to update restaurant information. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Welcome to Your Restaurant Dashboard!</h2>
        <p className="mb-4">Please complete your restaurant profile to get started.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Restaurant Address</label>
            <input
              type="text"
              value={info.address}
              onChange={(e) => setInfo({ 
                ...info, 
                address: e.target.value
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={info.phone}
              onChange={(e) => setInfo({ 
                ...info, 
                phone: e.target.value
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Restaurant Description</label>
            <textarea
              value={info.description}
              onChange={(e) => setInfo({ ...info, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}
