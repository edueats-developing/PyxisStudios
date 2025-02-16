'use client';

import StarRating from './StarRating';
import { useRouter } from 'next/navigation';

interface RestaurantCardProps {
  restaurant: {
    id: number;
    name: string;
    description: string | null;
    image_url?: string;
    average_rating?: number;
    review_count?: number;
    type?: 'restaurant' | 'convenience';
    categories?: string[];
  };
  onClick?: () => void;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const router = useRouter();
  return (
    <div 
      onClick={() => router.push(`/store/${restaurant.id}`)}
      className="border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer bg-white"
    >
      <div className="h-48 bg-gray-200 relative">
        {restaurant.image_url ? (
          <img 
            src={restaurant.image_url} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{restaurant.name}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{restaurant.description || 'No description available'}</p>
        {Array.isArray(restaurant.categories) && restaurant.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {restaurant.categories.map((category, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600"
              >
                {category}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center mb-2">
          <StarRating rating={restaurant.average_rating || 0} />
          <span className="text-sm text-gray-500 ml-1">
            {`(${restaurant.review_count || 0})`}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>15-30 mins</span>
          <span>$5.49 Delivery Fee</span>
        </div>
      </div>
    </div>
  );
}
