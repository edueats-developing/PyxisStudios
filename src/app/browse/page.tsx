'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RestaurantCard from '@/components/RestaurantCard';
import CategoryButton from '@/components/CategoryButton';

interface StoreBase {
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

interface CategoryCard {
  name: string;
  type: 'restaurant' | 'convenience';
  count: number;
}

interface StoreWithCategories {
  id: number;
  type: 'restaurant' | 'convenience';
  categories: string[] | undefined;
}

export default function BrowsePage() {
  const [stores, setStores] = useState<StoreBase[]>([]);
  const [categoryCards, setCategoryCards] = useState<CategoryCard[]>([]);
  const [selectedType, setSelectedType] = useState<'restaurant' | 'convenience' | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restaurantCategories = [
    'Japanese', 'Pizza', 'Indian', 'Italian', 'Korean', 
    'Chinese', 'Thai', 'Greek', 'Halal', 'Coffee'
  ];

  const convenienceCategories = ['Grocery', 'Convenience', 'Coffee'];

  useEffect(() => {
    fetchStores();
    fetchCategoryCards();
  }, [selectedType, selectedCategories]);

  const fetchStores = async () => {
    try {
      // First fetch stores
      let query = supabase.from('restaurants').select('*');

      if (selectedType) {
        query = query.eq('type', selectedType);
      }

      if (selectedCategories.length > 0) {
        query = query.overlaps('categories', selectedCategories);
      }

      const { data: storesData, error: storesError } = await query;
      if (storesError) throw storesError;

      // Then fetch all reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('restaurant_id, rating')
        .not('restaurant_id', 'is', null);
      
      if (reviewsError) throw reviewsError;

      // Calculate ratings in the frontend
      const storesWithRatings = storesData?.map(store => {
        const storeReviews = reviewsData?.filter(review => 
          review.restaurant_id === store.id
        ) || [];
        const reviewCount = storeReviews.length;
        const averageRating = reviewCount > 0
          ? storeReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
          : 0;

        return {
          ...store,
          average_rating: averageRating,
          review_count: reviewCount
        };
      }) || [];

      setStores(storesWithRatings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryCards = async () => {
    try {
      const { data: allStores, error } = await supabase
        .from('restaurants')
        .select('id, type, categories');

      if (error) throw error;

      const categoryCount = new Map<string, { type: 'restaurant' | 'convenience', count: number }>();

      (allStores as StoreWithCategories[])?.forEach(store => {
        if (Array.isArray(store.categories)) {
          store.categories.forEach((category: string) => {
            const key = category;
            if (!categoryCount.has(key)) {
              categoryCount.set(key, { type: store.type, count: 1 });
            } else {
              const current = categoryCount.get(key)!;
              categoryCount.set(key, { ...current, count: current.count + 1 });
            }
          });
        } else {
          console.warn(`Store ${store.id} has invalid categories:`, store.categories);
        }
      });

      const cards: CategoryCard[] = Array.from(categoryCount.entries()).map(([name, data]) => ({
        name,
        type: data.type,
        count: data.count
      }));

      setCategoryCards(cards);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Browse All Categories</h1>
      
      {/* Category Cards */}
      <div className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryCards.map((card) => (
            <div
              key={card.name}
              onClick={() => {
                setSelectedType(card.type);
                toggleCategory(card.name);
              }}
              className="p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <CategoryButton
                  category={card.name}
                  selected={selectedCategories.includes(card.name)}
                  onClick={() => {
                    // Using a wrapper function that doesn't take parameters
                    toggleCategory(card.name);
                  }}
                />
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {card.type}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {card.count} {card.count === 1 ? 'store' : 'stores'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Filter by Type</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${!selectedType
                ? 'bg-[#00A7A2] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedType('restaurant')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${selectedType === 'restaurant'
                ? 'bg-[#00A7A2] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Restaurants
          </button>
          <button
            onClick={() => setSelectedType('convenience')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${selectedType === 'convenience'
                ? 'bg-[#00A7A2] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Convenience
          </button>
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
