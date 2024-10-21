import React from 'react';
import { useCart } from './CartContext';

const ShoppingCart: React.FC = () => {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  if (items.length === 0) {
    return <div className="text-center p-4">Your cart is empty</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
      {items.map((item) => (
        <div key={item.id} className="flex justify-between items-center mb-2">
          <span>{item.name}</span>
          <div className="flex items-center">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l"
            >
              -
            </button>
            <span className="px-2">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r"
            >
              +
            </button>
          </div>
          <span>${(item.price * item.quantity).toFixed(2)}</span>
          <button
            onClick={() => removeItem(item.id)}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Remove
          </button>
        </div>
      ))}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-bold">Total:</span>
          <span className="font-bold">${total.toFixed(2)}</span>
        </div>
      </div>
      <button
        onClick={clearCart}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded w-full"
      >
        Clear Cart
      </button>
    </div>
  );
};

export default ShoppingCart;
