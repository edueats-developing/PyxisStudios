import React from 'react';
import { useCart, CartItem } from './CartContext';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface CheckoutButtonProps {
  user: User | null;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ user }) => {
  const { items: cart, clearCart } = useCart();
  const router = useRouter();

  const checkout = async () => {
    if (!user) {
      alert('Please log in to place an order');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      // Group cart items by restaurant
      const groupedCart = cart.reduce((acc, item) => {
        if (!acc[item.restaurant_id]) {
          acc[item.restaurant_id] = [];
        }
        acc[item.restaurant_id].push(item);
        return acc;
      }, {} as Record<number, CartItem[]>);

      const orderIds: number[] = [];

      // Create orders for each restaurant
      for (const [restaurantId, items] of Object.entries(groupedCart)) {
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        // Create the order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{ 
            user_id: user.id, 
            restaurant_id: parseInt(restaurantId),
            total_price: total, 
            status: 'pending' 
          }])
          .select();

        if (orderError) throw orderError;

        if (!orderData || orderData.length === 0) {
          throw new Error('No order data returned');
        }

        const orderId = orderData[0].id;
        orderIds.push(orderId);

        // Create order items
        const orderItems = items.map(item => ({
          order_id: orderId,
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          restaurant_id: item.restaurant_id
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      clearCart();
      router.push(`/order-confirmation?orderIds=${orderIds.join(',')}`);
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
