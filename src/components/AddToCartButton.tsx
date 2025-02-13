import React from 'react';
import { useCart } from './CartContext';

interface AddToCartButtonProps {
  item: {
    id: string;
    name: string;
    price: number;
    restaurant_id: number;
  };
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ item }) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({ ...item, quantity: 1 });
  };

  return (
    <button
      onClick={handleAddToCart}
      className="bg-[#00A7A2] text-white px-4 py-2 rounded hover:bg-[#33B8B4] transition-colors"
    >
      Add to Cart
    </button>
  );
};

export default AddToCartButton;
