'use client'

import React, { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { supabase } from '../lib/supabase';
import StarRating from './StarRating';

interface MenuItemVariant {
  id: number;
  name: string;
  price: number;
  is_default: boolean;
}

interface MenuItemAddon {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  restaurant_id: number;
  average_rating?: number;
  review_count?: number;
}

interface MenuItemPopupProps {
  item: MenuItem;
  onClose: () => void;
  isOpen: boolean;
}

export default function MenuItemPopup({ item, onClose, isOpen }: MenuItemPopupProps) {
  const [variants, setVariants] = useState<MenuItemVariant[]>([]);
  const [addons, setAddons] = useState<MenuItemAddon[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [userReview, setUserReview] = useState<any>(null);
  const { addItem } = useCart();

  useEffect(() => {
    if (isOpen) {
      fetchVariantsAndAddons();
      fetchReviews();
      fetchUser();
    }
  }, [isOpen, item.id]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profile:profiles!profile_id (
            id,
            role
          )
        `)
        .eq('menu_item_id', item.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(reviewsData || []);

      // Check if user has already reviewed
      if (user) {
        const existingReview = reviewsData?.find(r => r.user_id === user.id);
        if (existingReview) {
          setUserReview(existingReview);
          setUserRating(existingReview.rating);
          setReviewComment(existingReview.comment);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) return;

    try {
      const reviewData = {
        menu_item_id: item.id,
        restaurant_id: item.restaurant_id,
        user_id: user.id,
        profile_id: user.id,
        rating: userRating,
        comment: reviewComment,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('reviews')
        .upsert(userReview 
          ? { ...reviewData, id: userReview.id }
          : reviewData
        )
        .select();

      if (error) throw error;

      // Refresh reviews
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const fetchVariantsAndAddons = async () => {
    try {
      setLoading(true);
      
      // Fetch variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('menu_item_variants')
        .select('*')
        .eq('menu_item_id', item.id)
        .order('is_default', { ascending: false });
      
      if (variantsError) throw variantsError;
      
      // Fetch addons
      const { data: addonsData, error: addonsError } = await supabase
        .from('menu_item_addons')
        .select('*')
        .eq('menu_item_id', item.id)
        .order('category', { ascending: true });
      
      if (addonsError) throw addonsError;

      setVariants(variantsData || []);
      setAddons(addonsData || []);
      
      // Set default variant if available
      const defaultVariant = variantsData?.find(v => v.is_default) || variantsData?.[0];
      if (defaultVariant) {
        setSelectedVariant(defaultVariant);
      }
    } catch (error) {
      console.error('Error fetching variants and addons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantSelect = (variant: MenuItemVariant) => {
    setSelectedVariant(variant);
  };

  const handleAddonToggle = (addon: MenuItemAddon) => {
    setSelectedAddons(prev => {
      const isSelected = prev.some(a => a.id === addon.id);
      if (isSelected) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const calculateTotal = () => {
    const variantPrice = selectedVariant?.price || item.price;
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return variantPrice + addonsTotal;
  };

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      name: item.name,
      price: calculateTotal(),
      quantity: 1,
      restaurant_id: item.restaurant_id,
      variant: selectedVariant ? {
        id: selectedVariant.id,
        name: selectedVariant.name,
        price: selectedVariant.price
      } : undefined,
      addons: selectedAddons.map(addon => ({
        id: addon.id,
        name: addon.name,
        price: addon.price
      }))
    });
    onClose();
  };

  if (!isOpen) return null;

  // Group addons by category
  const addonsByCategory = addons.reduce((acc, addon) => {
    if (!acc[addon.category]) {
      acc[addon.category] = [];
    }
    acc[addon.category].push(addon);
    return acc;
  }, {} as Record<string, MenuItemAddon[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">{item.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {item.image_url && (
          <div className="relative w-full h-48 mb-4">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover rounded-md"
            />
          </div>
        )}

        <p className="text-gray-600 mb-4">{item.description}</p>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Select Size</h3>
                <div className="space-y-2">
                  {variants.map((variant) => (
                    <label
                      key={variant.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="variant"
                        checked={selectedVariant?.id === variant.id}
                        onChange={() => handleVariantSelect(variant)}
                        className="form-radio text-[#00A7A2]"
                      />
                      <span>{variant.name}</span>
                      <span className="ml-auto">${variant.price.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {Object.entries(addonsByCategory).map(([category, categoryAddons]) => (
              <div key={category} className="mb-6">
                <h3 className="font-semibold mb-2">{category}</h3>
                <div className="space-y-2">
                  {categoryAddons.map((addon) => (
                    <label
                      key={addon.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAddons.some(a => a.id === addon.id)}
                        onChange={() => handleAddonToggle(addon)}
                        className="form-checkbox text-[#00A7A2]"
                      />
                      <span>{addon.name}</span>
                      <span className="ml-auto">+${addon.price.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Total:</span>
                <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
              </div>
              <button
                onClick={handleAddToCart}
                className="w-full bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-[#33B8B4] transition-colors"
              >
                Add to Cart
              </button>
            </div>

            {/* Reviews Section */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold mb-4">Reviews</h3>
              
              {/* Average Rating */}
              <div className="flex items-center mb-4">
                <StarRating rating={item.average_rating || 0} />
                <span className="ml-2 text-sm text-gray-600">
                  ({reviews.length} reviews)
                </span>
              </div>

              {/* Add Review Form */}
              {user && (
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <StarRating
                      rating={userRating}
                      editable={true}
                      onRatingChange={(rating) => setUserRating(rating)}
                    />
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Write your review..."
                    className="w-full p-2 border rounded mb-2"
                    rows={3}
                  />
                  <button
                    onClick={handleSubmitReview}
                    className="bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-[#33B8B4] transition-colors"
                  >
                    {userReview ? 'Update Review' : 'Submit Review'}
                  </button>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <StarRating rating={review.rating} />
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                    <p className="text-sm text-gray-500 mt-1">By: {review.profile.role || 'Anonymous'}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
