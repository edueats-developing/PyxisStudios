'use client';

import StarRating from './StarRating';

interface RestaurantCardProps {
  restaurant: {
    id: number;
    name: string;
    description: string;
    image_url?: string;
    average_rating?: number;
    review_count?: number;
  };
  onClick: () => void;
}

export default function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  return (
    <div 
      onClick={onClick}
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
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{restaurant.description}</p>
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={restaurant.average_rating || 0} />
          <span className="text-sm text-gray-500">
            {restaurant.review_count ? `(${restaurant.review_count} reviews)` : 'No reviews yet'}
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
