'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RestaurantCard from '@/components/RestaurantCard';
import CategoryButton from '@/components/CategoryButton';

interface Store {
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

export default function ConveniencePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allCategories = ['Grocery', 'Convenience', 'Coffee'];

  useEffect(() => {
    fetchStores();
  }, [selectedCategories]);

  const fetchStores = async () => {
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('type', 'convenience');

      if (selectedCategories.length > 0) {
        query = query.overlaps('categories', selectedCategories);
      }

      const { data, error } = await query;

      if (error) throw error;

      setStores(data || []);
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

  if (loading) return <div className="p-8">Loading stores...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Convenience Stores</h1>
      
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

      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map(store => (
          <RestaurantCard
            key={store.id}
            restaurant={store}
          />
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No stores found matching the selected criteria.
        </div>
      )}
    </div>
  );
}
