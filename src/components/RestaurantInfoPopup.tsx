'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Form input state
interface RestaurantInfo {
  address: string | null;
  phone: string | null;
  description: string | null;
}

interface RestaurantInfoPopupProps {
  restaurant: {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    description: string | null;
    admin_id: string;
  };
  onUpdate?: () => void;
}

// Match database schema
interface RestaurantData {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  admin_id: string;
  created_at?: string;
  updated_at?: string;
}

export default function RestaurantInfoPopup({ 
  restaurant: initialData,
  onUpdate 
}: RestaurantInfoPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [info, setInfo] = useState<RestaurantInfo>({
    address: null,
    phone: null,
    description: null
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log('Initial restaurant data:', initialData);
    const shouldShow = !initialData.address;
    console.log('Should show popup:', shouldShow);
    
    setIsOpen(shouldShow);
    setInfo({
      address: initialData.address,
      phone: initialData.phone,
      description: initialData.description
    });
  }, [initialData]);

  const validateInputs = () => {
    // Trim inputs to check for empty strings
    const trimmedAddress = info.address?.trim() || '';
    const trimmedPhone = info.phone?.trim() || '';
    const trimmedDescription = info.description?.trim() || '';

    if (!trimmedAddress) {
      setError('Please enter a valid address');
      return false;
    }

    // Phone number should contain only digits, spaces, +, -, and ()
    const phoneRegex = /^[+\d\s-()]+$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setError('Please enter a valid phone number');
      return false;
    }

    if (!trimmedDescription) {
      setError('Please enter a restaurant description');
      return false;
    }

    return {
      address: trimmedAddress,
      phone: trimmedPhone,
      description: trimmedDescription
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    // Validate inputs
    const validatedData = validateInputs();
    if (!validatedData) {
      setIsSaving(false);
      return;
    }

    try {
      console.log('Inserting restaurant data:', {
        id: initialData.id,
        updates: validatedData
      });
      
      // Log the query that will be executed
      console.log('Executing insert query:', {
        table: 'restaurants',
        where: { id: initialData.id },
        set: {
          address: validatedData.address,
          phone: validatedData.phone,
          description: validatedData.description
        }
      });

      // Update restaurant data using admin_id from initialData
      const { error: updateError, data } = await supabase
        .from('restaurants')
        .update({
          address: validatedData.address,
          phone: validatedData.phone,
          description: validatedData.description
        })
        .eq('id', initialData.id)
        .eq('admin_id', initialData.admin_id) // Use admin_id from props
        .select();

      if (updateError) {
        console.error('Update error:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        
        // Handle all error cases
        const errorMessage = (() => {
          switch (updateError.code) {
            case '42501':
              return 'You do not have permission to update this restaurant.';
            case '23505':
              return 'This information conflicts with an existing restaurant.';
            case 'PGRST204':
              return 'No matching restaurant found. Please ensure you have the correct permissions.';
            default:
              return `Failed to update restaurant: ${updateError.message}`;
          }
        })();
        
        setError(errorMessage);
        return;
      }

      // Verify the update was successful
      if (!data || data.length === 0) {
        console.error('Update failed: No data returned');
        setError('Failed to update restaurant information. Please try again.');
        return;
      }

      // Verify the returned data matches what we sent
      const updatedRestaurant = data[0];
      if (updatedRestaurant.address !== validatedData.address ||
          updatedRestaurant.phone !== validatedData.phone ||
          updatedRestaurant.description !== validatedData.description) {
        console.error('Update verification failed:', {
          sent: validatedData,
          received: updatedRestaurant
        });
        setError('Restaurant update could not be verified. Please try again.');
        return;
      }

      console.log('Update successful. Updated restaurant:', updatedRestaurant);

      // Show success message and update UI
      setSuccess('Restaurant information saved successfully!');
      
      // Notify parent component to refresh data
      if (onUpdate) {
        await onUpdate();
      }

      // Close after parent data is refreshed
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error('Error saving restaurant info:', err);
      setError(err.message || 'Failed to save restaurant information. Please try again.');
    } finally {
      setIsSaving(false);
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
              value={info.address || ''}
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
              value={info.phone || ''}
              onChange={(e) => setInfo({ 
                ...info, 
                phone: e.target.value
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              placeholder="+61 123 456 789"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter phone number with country code (e.g., +61 for Australia)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Restaurant Description</label>
            <textarea
              value={info.description || ''}
              onChange={(e) => setInfo({ ...info, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              required
              placeholder="Tell customers about your restaurant, cuisine, and specialties..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Provide a brief description of your restaurant to help customers learn more about your business
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm mb-2 text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-600 text-sm mb-2 text-center">
              {success}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
