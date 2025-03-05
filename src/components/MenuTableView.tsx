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

interface MenuTableViewProps {
  menuItems: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
  onManageOptions: (id: number) => void;
  onToggleFeatured: (item: MenuItem) => void;
}

export default function MenuTableView({
  menuItems,
  onEdit,
  onDelete,
  onManageOptions,
  onToggleFeatured
}: MenuTableViewProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {menuItems.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    {item.image_url ? (
                      <img className="h-10 w-10 rounded-md object-cover" src={item.image_url} alt="" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-[300px]">{item.description}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{item.category}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-[#00A7A2]">${parseFloat(item.price).toFixed(2)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button 
                  onClick={() => onToggleFeatured(item)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.featured 
                      ? 'bg-[#00A7A2] bg-opacity-10 text-[#00A7A2]' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.featured && <SparklesIcon className="h-3 w-3 mr-1" />}
                  {item.featured ? 'Featured' : 'Regular'}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onManageOptions(item.id)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    title="Manage Options"
                  >
                    <AdjustmentsHorizontalIcon className="h-5 w-5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    title="Edit Item"
                  >
                    <PencilIcon className="h-5 w-5 text-green-600" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    title="Delete Item"
                  >
                    <TrashIcon className="h-5 w-5 text-red-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
