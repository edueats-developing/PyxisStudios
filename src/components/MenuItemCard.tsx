'use client';

import StarRating from './StarRating';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  featured?: boolean;
  average_rating?: number;
  review_count?: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: () => void;
}

export default function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  return (
    <div className="flex gap-4 border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white relative">
      {item.featured && (
        <div className="absolute -top-2 -right-2 bg-[#00A7A2] text-white p-1 rounded-full">
          <SparklesIcon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg mb-1">{item.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
        <div className="flex items-center gap-2 mb-2">
          <p className="font-semibold text-[#00A7A2]">${item.price.toFixed(2)}</p>
          {item.average_rating !== undefined && (
            <div className="flex items-center gap-1">
              <StarRating rating={item.average_rating} />
              <span className="text-sm text-gray-500">({item.review_count || 0})</span>
            </div>
          )}
        </div>
        <button
          onClick={onAddToCart}
          className="mt-2 bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-[#33B8B4] transition-colors"
        >
          Add to Cart
        </button>
      </div>
      <div className="w-32 h-32 flex-shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
