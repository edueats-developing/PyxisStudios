'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Variant {
  id: number;
  name: string;
  price: number;
  is_default: boolean;
}

interface Addon {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface MenuItemOptionsManagerProps {
  menuItemId: number;
  onUpdate?: () => void;
}

export default function MenuItemOptionsManager({ menuItemId, onUpdate }: MenuItemOptionsManagerProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [activeTab, setActiveTab] = useState<'variants' | 'addons'>('variants');
  const [newVariant, setNewVariant] = useState({ name: '', price: '', is_default: false });
  const [newAddon, setNewAddon] = useState({ name: '', price: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addonCategories, setAddonCategories] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchVariantsAndAddons();
  }, [menuItemId]);

  const fetchVariantsAndAddons = async () => {
    try {
      setLoading(true);
      
      // Fetch variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('menu_item_variants')
        .select('*')
        .eq('menu_item_id', menuItemId)
        .order('is_default', { ascending: false });
      
      if (variantsError) throw variantsError;
      
      // Fetch addons
      const { data: addonsData, error: addonsError } = await supabase
        .from('menu_item_addons')
        .select('*')
        .eq('menu_item_id', menuItemId)
        .order('category', { ascending: true });
      
      if (addonsError) throw addonsError;

      setVariants(variantsData || []);
      setAddons(addonsData || []);
      
      // Extract unique categories
      const categories = Array.from(new Set((addonsData || []).map(addon => addon.category)));
      setAddonCategories(categories);
      
      // Set the first category as expanded if any exist
      if (categories.length > 0 && !expandedCategory) {
        setExpandedCategory(categories[0]);
      }
      
    } catch (error) {
      console.error('Error fetching variants and addons:', error);
      setError('Failed to load variants and addons');
    } finally {
      setLoading(false);
    }
  };

  const addVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('menu_item_variants')
        .insert([{
          menu_item_id: menuItemId,
          name: newVariant.name,
          price: parseFloat(newVariant.price),
          is_default: newVariant.is_default
        }]);

      if (error) throw error;
      
      fetchVariantsAndAddons();
      setNewVariant({ name: '', price: '', is_default: false });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding variant:', error);
      setError('Failed to add variant');
    }
  };

  const addAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('menu_item_addons')
        .insert([{
          menu_item_id: menuItemId,
          name: newAddon.name,
          price: parseFloat(newAddon.price),
          category: newAddon.category
        }]);

      if (error) throw error;
      
      fetchVariantsAndAddons();
      setNewAddon({ name: '', price: '', category: newAddon.category });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding addon:', error);
      setError('Failed to add addon');
    }
  };

  const deleteVariant = async (variantId: number) => {
    try {
      const { error } = await supabase
        .from('menu_item_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;
      fetchVariantsAndAddons();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting variant:', error);
      setError('Failed to delete variant');
    }
  };

  const deleteAddon = async (addonId: number) => {
    try {
      const { error } = await supabase
        .from('menu_item_addons')
        .delete()
        .eq('id', addonId);

      if (error) throw error;
      fetchVariantsAndAddons();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting addon:', error);
      setError('Failed to delete addon');
    }
  };

  const setDefaultVariant = async (variantId: number) => {
    try {
      // First, set all variants to non-default
      await supabase
        .from('menu_item_variants')
        .update({ is_default: false })
        .eq('menu_item_id', menuItemId);

      // Then set the selected variant as default
      const { error } = await supabase
        .from('menu_item_variants')
        .update({ is_default: true })
        .eq('id', variantId);

      if (error) throw error;
      fetchVariantsAndAddons();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error setting default variant:', error);
      setError('Failed to set default variant');
    }
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('variants')}
          className={`px-4 py-3 font-medium text-sm flex-1 text-center ${
            activeTab === 'variants'
              ? 'bg-white border-b-2 border-[#00A7A2] text-[#00A7A2]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          Variants
        </button>
        <button
          onClick={() => setActiveTab('addons')}
          className={`px-4 py-3 font-medium text-sm flex-1 text-center ${
            activeTab === 'addons'
              ? 'bg-white border-b-2 border-[#00A7A2] text-[#00A7A2]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          Add-ons
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00A7A2]"></div>
          </div>
        ) : (
          <>
            {activeTab === 'variants' ? (
              <div>
                <form onSubmit={addVariant} className="mb-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Variant Name (e.g., Small, Medium, Large)"
                        value={newVariant.name}
                        onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-[#00A7A2] focus:border-[#00A7A2]"
                        required
                      />
                    </div>
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Price"
                          value={newVariant.price}
                          onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                          className="pl-7 w-full p-2 border rounded focus:ring-[#00A7A2] focus:border-[#00A7A2]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={newVariant.is_default}
                      onChange={(e) => setNewVariant({ ...newVariant, is_default: e.target.checked })}
                      className="h-4 w-4 text-[#00A7A2] focus:ring-[#00A7A2] border-gray-300 rounded"
                    />
                    <label htmlFor="is_default" className="text-sm text-gray-700">
                      Set as default variant
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-[#33B8B4] transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Variant
                  </button>
                </form>

                {variants.length > 0 ? (
                  <div className="space-y-2">
                    {variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          {variant.is_default && (
                            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                          )}
                          <span className={`font-medium ${variant.is_default ? 'text-[#00A7A2]' : ''}`}>
                            {variant.name}
                          </span>
                          <span className="ml-2 text-gray-600">
                            ${variant.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {!variant.is_default && (
                            <button
                              onClick={() => setDefaultVariant(variant.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => deleteVariant(variant.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No variants added yet. Add your first variant above.
                  </div>
                )}
              </div>
            ) : (
              <div>
                <form onSubmit={addAddon} className="mb-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Add-on Name (e.g., Extra Cheese)"
                        value={newAddon.name}
                        onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-[#00A7A2] focus:border-[#00A7A2]"
                        required
                      />
                    </div>
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Price"
                          value={newAddon.price}
                          onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
                          className="pl-7 w-full p-2 border rounded focus:ring-[#00A7A2] focus:border-[#00A7A2]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Category (e.g., Toppings, Sauces)"
                    list="addon-categories"
                    value={newAddon.category}
                    onChange={(e) => setNewAddon({ ...newAddon, category: e.target.value })}
                    className="w-full p-2 border rounded focus:ring-[#00A7A2] focus:border-[#00A7A2]"
                    required
                  />
                  <datalist id="addon-categories">
                    {addonCategories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-[#33B8B4] transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Add-on
                  </button>
                </form>

                {addonCategories.length > 0 ? (
                  <div className="space-y-4">
                    {addonCategories.map((category) => (
                      <div key={category} className="border border-gray-200 rounded overflow-hidden">
                        <div 
                          className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleCategoryExpansion(category)}
                        >
                          <h3 className="font-medium text-gray-700">{category}</h3>
                          <span className="text-gray-500 text-sm">
                            {addons.filter(addon => addon.category === category).length} items
                          </span>
                        </div>
                        {expandedCategory === category && (
                          <div className="divide-y divide-gray-200">
                            {addons
                              .filter(addon => addon.category === category)
                              .map((addon) => (
                                <div
                                  key={addon.id}
                                  className="flex items-center justify-between p-3 hover:bg-gray-50"
                                >
                                  <div>
                                    <span>{addon.name}</span>
                                    <span className="ml-2 text-[#00A7A2] font-medium">
                                      +${addon.price.toFixed(2)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => deleteAddon(addon.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No add-ons created yet. Add your first add-on above.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
