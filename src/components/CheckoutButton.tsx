import React from 'react';
import { useCart } from './CartContext';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface CheckoutButtonProps {
  user: User | null;
  selectedRestaurant: number | null;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ user, selectedRestaurant }) => {
  const { items: cart, clearCart } = useCart();
  const router = useRouter();

  const checkout = async () => {
    if (!user) {
      alert('Please log in to place an order');
      return;
    }

    if (!selectedRestaurant) {
      alert('Please select a restaurant');
      return;
    }

    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
          user_id: user.id, 
          restaurant_id: selectedRestaurant,
          total_price: total, 
          status: 'pending' 
        }])
        .select();

      if (orderError) throw orderError;

      if (!orderData || orderData.length === 0) {
        throw new Error('No order data returned');
      }

      const orderId = orderData[0].id;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderId,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <button
      onClick={checkout}
      className="mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
      disabled={cart.length === 0}
    >
      Checkout
    </button>
  );
};

export default CheckoutButton;
