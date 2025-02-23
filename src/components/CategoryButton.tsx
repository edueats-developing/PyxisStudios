'use client';

import {
  BuildingStorefrontIcon,
  FireIcon,
  SparklesIcon,
  GlobeAltIcon,
  SunIcon,
  BeakerIcon,
  ShoppingBagIcon,
  CakeIcon,
  HomeIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';

const categoryIcons: { [key: string]: React.ElementType } = {
  // Restaurant categories
  'Japanese': HomeIcon,
  'Pizza': FireIcon,
  'Indian': SparklesIcon,
  'Italian': BuildingStorefrontIcon,
  'Korean': SunIcon,
  'Chinese': BuildingStorefrontIcon,
  'Thai': FireIcon,
  'Greek': GlobeAltIcon,
  'Halal': SparklesIcon,
  'Coffee': CakeIcon,
  // Convenience categories
  'Grocery': ShoppingBagIcon,
  'Convenience': BuildingStorefrontIcon,
  // Special categories
  'Reviews': ChatBubbleBottomCenterTextIcon,
};

interface CategoryButtonProps {
  category: string;
  selected: boolean;
  onClick: () => void;
}

export default function CategoryButton({ category, selected, onClick }: CategoryButtonProps) {
  const Icon = categoryIcons[category] || BuildingStorefrontIcon;

  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors
        ${selected
          ? 'bg-[#00A7A2] text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {category}
    </button>
  );
}
