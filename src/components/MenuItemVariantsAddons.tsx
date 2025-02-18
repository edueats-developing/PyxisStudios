'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

interface Props {
  menuItemId: number;
  onClose: () => void;
}

export default function MenuItemVariantsAddons({ menuItemId, onClose }: Props) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [activeTab, setActiveTab] = useState<'variants' | 'addons'>('variants');
  const [newVariant, setNewVariant] = useState({ name: '', price: '', is_default: false });
  const [newAddon, setNewAddon] = useState({ name: '', price: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setNewAddon({ name: '', price: '', category: '' });
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
    } catch (error) {
      console.error('Error setting default variant:', error);
      setError('Failed to set default variant');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('variants')}
              className={`px-4 py-2 rounded-t-lg ${
                activeTab === 'variants'
                  ? 'bg-[#00A7A2] text-white'
                  : 'bg-gray-100'
              }`}
            >
              Variants
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`px-4 py-2 rounded-t-lg ${
                activeTab === 'addons'
                  ? 'bg-[#00A7A2] text-white'
                  : 'bg-gray-100'
              }`}
            >
              Addons
            </button>
          </div>
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

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            {activeTab === 'variants' ? (
              <div>
                <form onSubmit={addVariant} className="mb-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Variant Name (e.g., Small, Medium, Large)"
                    value={newVariant.name}
                    onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={newVariant.price}
                    onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newVariant.is_default}
                      onChange={(e) => setNewVariant({ ...newVariant, is_default: e.target.checked })}
                      className="form-checkbox text-[#00A7A2]"
                    />
                    <span>Set as default variant</span>
                  </label>
                  <button
                    type="submit"
                    className="w-full bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-[#33B8B4]"
                  >
                    Add Variant
                  </button>
                </form>

                <div className="space-y-2">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <span className="font-medium">{variant.name}</span>
                        <span className="ml-2 text-gray-600">
                          ${variant.price.toFixed(2)}
                        </span>
                        {variant.is_default && (
                          <span className="ml-2 text-sm text-green-600">
                            (Default)
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {!variant.is_default && (
                          <button
                            onClick={() => setDefaultVariant(variant.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => deleteVariant(variant.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <form onSubmit={addAddon} className="mb-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Addon Name (e.g., Extra Cheese)"
                    value={newAddon.name}
                    onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={newAddon.price}
                    onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Category (e.g., Toppings, Sauces)"
                    value={newAddon.category}
                    onChange={(e) => setNewAddon({ ...newAddon, category: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-[#33B8B4]"
                  >
                    Add Addon
                  </button>
                </form>

                <div className="space-y-4">
                  {Object.entries(
                    addons.reduce((acc, addon) => {
                      if (!acc[addon.category]) {
                        acc[addon.category] = [];
                      }
                      acc[addon.category].push(addon);
                      return acc;
                    }, {} as Record<string, Addon[]>)
                  ).map(([category, categoryAddons]) => (
                    <div key={category} className="bg-gray-50 p-4 rounded">
                      <h3 className="font-semibold mb-2">{category}</h3>
                      <div className="space-y-2">
                        {categoryAddons.map((addon) => (
                          <div
                            key={addon.id}
                            className="flex items-center justify-between p-2 bg-white rounded"
                          >
                            <div>
                              <span>{addon.name}</span>
                              <span className="ml-2 text-gray-600">
                                +${addon.price.toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={() => deleteAddon(addon.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
