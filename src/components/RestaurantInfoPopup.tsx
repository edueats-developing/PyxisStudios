'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Form input state
interface RestaurantInfo {
  address: string | null;
  phone: string | null;
  description: string | null;
  type: 'restaurant' | 'convenience' | null;
  categories: string[];
}

const RESTAURANT_CATEGORIES = [
  'Japanese', 'Pizza', 'Indian', 'Italian', 'Korean', 
  'Chinese', 'Thai', 'Greek', 'Halal', 'Coffee'
];

const CONVENIENCE_CATEGORIES = [
  'Grocery', 'Convenience', 'Coffee'
];

interface RestaurantInfoPopupProps {
  restaurant: {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    description: string | null;
    admin_id: string;
    type: 'restaurant' | 'convenience' | null;
    categories: string[];
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
  type: 'restaurant' | 'convenience' | null;
  categories: string[];
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
    description: null,
    type: null,
    categories: []
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log('Initial restaurant data:', initialData);
    const hasRequiredFields = initialData.address && initialData.phone;
    const hasOptionalFields = initialData.type && initialData.categories?.length;
    const isComplete = hasRequiredFields && hasOptionalFields;
    
    // Only show popup if required fields are missing
    const shouldShow = !hasRequiredFields;
    console.log('Should show popup:', shouldShow);
    
    // If all fields are complete, clear the force close flag
    if (isComplete) {
      localStorage.removeItem(`restaurantPopupClosed_${initialData.id}`);
    }
    
    // Check if popup was manually closed
    const wasClosed = localStorage.getItem(`restaurantPopupClosed_${initialData.id}`);
    
    setIsOpen(shouldShow && !wasClosed);
    setInfo({
      address: initialData.address,
      phone: initialData.phone,
      description: initialData.description,
      type: initialData.type as 'restaurant' | 'convenience' | null,
      categories: initialData.categories || []
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
      description: trimmedDescription,
      type: info.type,
      categories: info.categories
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
          description: validatedData.description,
          type: validatedData.type,
          categories: validatedData.categories
        }
      });

      // Update restaurant data using admin_id from initialData
      const { error: updateError, data } = await supabase
        .from('restaurants')
        .update({
          address: validatedData.address,
          phone: validatedData.phone,
          description: validatedData.description,
          type: validatedData.type,
          categories: validatedData.categories
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
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button
          onClick={() => {
            localStorage.setItem(`restaurantPopupClosed_${initialData.id}`, 'true');
            setIsOpen(false);
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-4">Welcome to Your Restaurant Dashboard!</h2>
        <p className="mb-4">Please complete your restaurant profile to get started. Fields marked as (Required) must be filled out, while (Recommended) fields help customers find your store more easily.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Restaurant Address <span className="text-red-500">(Required)</span>
            </label>
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
            <label className="block text-sm font-medium text-gray-700">
              Phone Number <span className="text-red-500">(Required)</span>
            </label>
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
            <label className="block text-sm font-medium text-gray-700">
              Store Type <span className="text-blue-500">(Recommended)</span>
            </label>
            <select
              value={info.type || ''}
              onChange={(e) => {
                const newType = e.target.value as 'restaurant' | 'convenience' | null;
                setInfo({ 
                  ...info, 
                  type: newType,
                  categories: [] // Reset categories when type changes
                });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a type</option>
              <option value="restaurant">Restaurant</option>
              <option value="convenience">Convenience Store</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Categories <span className="text-blue-500">(Recommended)</span>
            </label>
            <div className="mt-2 space-y-2">
              {info.type && (info.type === 'restaurant' ? RESTAURANT_CATEGORIES : CONVENIENCE_CATEGORIES).map((category) => (
                <label key={category} className="inline-flex items-center mr-4 mb-2">
                  <input
                    type="checkbox"
                    checked={info.categories.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setInfo({
                          ...info,
                          categories: [...info.categories, category]
                        });
                      } else {
                        setInfo({
                          ...info,
                          categories: info.categories.filter(c => c !== category)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Store Description <span className="text-red-500">(Required)</span>
            </label>
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
