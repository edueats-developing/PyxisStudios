'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RestaurantCard from '@/components/RestaurantCard';
import CategoryButton from '@/components/CategoryButton';

interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  type: 'restaurant' | 'convenience';
  categories: string[] | undefined;
  image_url?: string;
  average_rating?: number;
  review_count?: number;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allCategories = [
    'Japanese', 'Pizza', 'Indian', 'Italian', 'Korean', 
    'Chinese', 'Thai', 'Greek', 'Halal', 'Coffee'
  ];

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCategories]);

  const fetchRestaurants = async () => {
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('type', 'restaurant');

      if (selectedCategories.length > 0) {
        // Use overlaps to get restaurants matching ANY of the selected categories
        query = query.overlaps('categories', selectedCategories);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort restaurants by how many selected categories they match
      const sortedData = (data || []).sort((a, b) => {
        if (!selectedCategories.length) return 0;
        
        // Count matching categories for each restaurant
        const aMatches = (a.categories || []).filter(cat => 
          selectedCategories.includes(cat)
        ).length;
        const bMatches = (b.categories || []).filter(cat => 
          selectedCategories.includes(cat)
        ).length;

        // Sort by number of matches (descending) then by name (ascending)
        if (aMatches !== bMatches) {
          return bMatches - aMatches;
        }
        return (a.name || '').localeCompare(b.name || '');
      });

      setRestaurants(sortedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (loading) return <div className="p-8">Loading restaurants...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Restaurants</h1>
      
      {/* Category Filters */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Filter by Category</h2>
        <div className="flex flex-wrap gap-2">
          {allCategories.map(category => (
            <CategoryButton
              key={category}
              category={category}
              selected={selectedCategories.includes(category)}
              onClick={() => toggleCategory(category)}
            />
          ))}
        </div>
      </div>

      {/* Restaurant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map(restaurant => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
          />
        ))}
      </div>

      {restaurants.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No restaurants found matching the selected criteria.
        </div>
      )}
    </div>
  );
}
