import React, { useState } from 'react';
import { useCart, CartItem } from './CartContext';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { PaymentForm } from './PaymentForm';

interface CheckoutButtonProps {
  user: User | null;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ user }) => {
  const { items: cart, clearCart } = useCart();
  const router = useRouter();
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);

  const initiateCheckout = async () => {
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
            status: 'pending',
            payment_status: 'pending'
          }])
          .select();

        if (orderError) throw orderError;

        if (!orderData || orderData.length === 0) {
          throw new Error('No order data returned');
        }

        const orderId = orderData[0].id;
        orderIds.push(orderId);
        setOrderId(orderId); // Store the order ID for payment intent

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

        // Create payment intent
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items,
            userId: user.id,
            orderId
          }),
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setClientSecret(data.clientSecret);
        setShowPayment(true);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    if (orderId) {
      router.push(`/order-confirmation?orderId=${orderId}`);
    }
  };

  if (showPayment && clientSecret) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
          <PaymentForm
            clientSecret={clientSecret}
            onPaymentSuccess={handlePaymentSuccess}
          />
          <button
            onClick={() => setShowPayment(false)}
            className="mt-4 w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={initiateCheckout}
      className="mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
      disabled={cart.length === 0}
    >
      Checkout
    </button>
  );
};

export default CheckoutButton;
