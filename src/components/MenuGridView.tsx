'use client';

import React from 'react';
import { SparklesIcon, PencilIcon, TrashIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string | null;
  restaurant_id: number;
  featured?: boolean;
}

interface MenuGridViewProps {
  menuItems: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
  onManageOptions: (id: number) => void;
  onToggleFeatured: (item: MenuItem) => void;
}

export default function MenuGridView({
  menuItems,
  onEdit,
  onDelete,
  onManageOptions,
  onToggleFeatured
}: MenuGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {menuItems.map((item) => (
        <div 
          key={item.id} 
          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden relative group"
        >
          {/* Featured badge */}
          {item.featured && (
            <div className="absolute top-2 right-2 z-10 bg-[#00A7A2] text-white p-1 rounded-full">
              <SparklesIcon className="h-5 w-5" />
            </div>
          )}
          
          {/* Image section */}
          <div className="h-48 w-full bg-gray-200 relative">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Quick action overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(item)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Edit Item"
              >
                <PencilIcon className="h-5 w-5 text-green-600" />
              </button>
              <button
                onClick={() => onManageOptions(item.id)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Manage Options"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-blue-600" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Delete Item"
              >
                <TrashIcon className="h-5 w-5 text-red-600" />
              </button>
            </div>
          </div>
          
          {/* Content section */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <span className="text-[#00A7A2] font-bold">${parseFloat(item.price).toFixed(2)}</span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
            
            <div className="flex justify-between items-center">
              <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-700">
                {item.category}
              </span>
              
              <button
                onClick={() => onToggleFeatured(item)}
                className={`flex items-center text-xs px-3 py-1 rounded-full ${
                  item.featured 
                    ? 'bg-[#00A7A2] bg-opacity-10 text-[#00A7A2]' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {item.featured && <SparklesIcon className="h-3 w-3 mr-1" />}
                {item.featured ? 'Featured' : 'Regular'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
