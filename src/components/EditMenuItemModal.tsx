'use client'

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string | null;
  restaurant_id: number;
}

interface Props {
  item: MenuItem;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditMenuItemModal({ item, onClose, onUpdate }: Props) {
  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let image_url = item.image_url;

      // Handle image upload if a new image is selected
      if (imageFile) {
        // Delete old image if it exists
        if (item.image_url) {
          const oldImagePath = item.image_url.split('/').pop();
          if (oldImagePath) {
            await supabase.storage
              .from('menu-images')
              .remove([`${item.restaurant_id}/${oldImagePath}`]);
          }
        }

        // Upload new image
        const { data, error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(`${item.restaurant_id}/${Date.now()}-${imageFile.name}`, imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(data.path);
        
        image_url = publicUrl;
      }

      // Update menu item
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          image_url
        })
        .eq('id', item.id)
        .eq('restaurant_id', item.restaurant_id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating menu item:', err);
      setError('Failed to update menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Edit Menu Item</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-32 h-32 object-cover rounded mb-2"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-[#33B8B4] transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
