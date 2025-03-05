'use client';

import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PhotoIcon, PlusIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  id?: number;
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string | null;
  restaurant_id: number;
  featured?: boolean;
}

interface MenuItemSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  item?: MenuItem | null;
  restaurantId: number;
  onSave: () => void;
  categories: string[];
}

export default function MenuItemSlidePanel({
  isOpen,
  onClose,
  item,
  restaurantId,
  onSave,
  categories
}: MenuItemSlidePanelProps) {
  const [formData, setFormData] = useState<MenuItem>({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: null,
    restaurant_id: restaurantId,
    featured: false
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!item?.id;

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image_url: item.image_url,
        restaurant_id: item.restaurant_id,
        featured: item.featured || false
      });
      setImagePreview(item.image_url);
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: categories.length > 0 ? categories[0] : '',
        image_url: null,
        restaurant_id: restaurantId,
        featured: false
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setError(null);
  }, [item, restaurantId, categories]);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    
    // Create preview URL
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    fileReader.readAsDataURL(file);
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  // Handle image drop zone click
  const handleImageZoneClick = () => {
    fileInputRef.current?.click();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let image_url = formData.image_url;

      // Handle image upload if a new image is selected
      if (imageFile) {
        // Delete old image if it exists and we're editing
        if (isEditMode && formData.image_url) {
          const oldImagePath = formData.image_url.split('/').pop();
          if (oldImagePath) {
            await supabase.storage
              .from('menu-images')
              .remove([`${restaurantId}/${oldImagePath}`]);
          }
        }

        // Upload new image
        const { data, error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(`${restaurantId}/${Date.now()}-${imageFile.name}`, imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(data.path);
        
        image_url = publicUrl;
      }

      if (isEditMode && formData.id) {
        // Update existing menu item
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            name: formData.name,
            description: formData.description,
            price: formData.price,
            category: formData.category,
            image_url,
            featured: formData.featured
          })
          .eq('id', formData.id)
          .eq('restaurant_id', restaurantId);

        if (updateError) throw updateError;
      } else {
        // Create new menu item
        const { error: insertError } = await supabase
          .from('menu_items')
          .insert([{
            name: formData.name,
            description: formData.description,
            price: formData.price,
            category: formData.category,
            image_url,
            restaurant_id: restaurantId,
            featured: formData.featured
          }]);

        if (insertError) throw insertError;
      }

      setImageFile(null);
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving menu item:', err);
      setError('Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-6 bg-[#00A7A2] sm:px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">
                  {isEditMode ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
                <button
                  type="button"
                  className="text-white hover:text-gray-200"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'basic'
                    ? 'border-[#00A7A2] text-[#00A7A2]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Info
              </button>
              <button
                className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'advanced'
                    ? 'border-[#00A7A2] text-[#00A7A2]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('advanced')}
              >
                Advanced Options
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XMarkIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'basic' && (
                <div className="px-4 py-5 space-y-6 sm:px-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      placeholder="Menu item name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7A2] focus:border-[#00A7A2]"
                      required
                    />
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description*
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      placeholder="Describe the menu item"
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7A2] focus:border-[#00A7A2]"
                      required
                    />
                  </div>
                  
                  {/* Price */}
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Price*
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        name="price"
                        id="price"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={handleChange}
                        className="pl-7 mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A7A2] focus:border-[#00A7A2]"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category*
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <select
                        name="category"
                        id="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#00A7A2] focus:border-[#00A7A2]"
                        required
                      >
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))
                        ) : (
                          <option value="">No categories available</option>
                        )}
                      </select>
                    </div>
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Image
                    </label>
                    <div 
                      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer"
                      onClick={handleImageZoneClick}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <div className="space-y-1 text-center">
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="mx-auto h-32 w-32 object-cover rounded-md" 
                          />
                        ) : (
                          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        )}
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-[#00A7A2] hover:text-[#33B8B4] focus-within:outline-none">
                            <span>{imagePreview ? 'Change image' : 'Upload a file'}</span>
                            <input
                              ref={fileInputRef}
                              name="image"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="px-4 py-5 space-y-6 sm:px-6">
                  {/* Featured Item */}
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="featured"
                        name="featured"
                        type="checkbox"
                        checked={formData.featured}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-[#00A7A2] focus:ring-[#00A7A2] border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="featured" className="font-medium text-gray-700">
                        Featured Item
                      </label>
                      <p className="text-gray-500">
                        Featured items will be highlighted in the menu and may appear in promotional sections.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-4 py-4 bg-gray-50 sm:px-6 mt-auto">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A7A2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#00A7A2] hover:bg-[#33B8B4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A7A2] ${
                      loading ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 
                      'Saving...' : 
                      isEditMode ? 'Save Changes' : 'Add Item'
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
