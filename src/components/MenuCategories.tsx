'use client';

import { useEffect, useState } from 'react';

interface MenuCategoriesProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function MenuCategories({
  categories,
  selectedCategory,
  onSelectCategory,
}: MenuCategoriesProps) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsSticky(offset > 200); // Adjust this value based on your header height
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCategory = (category: string) => {
    onSelectCategory(category);
    const element = document.getElementById(category);
    if (element) {
      const offset = 80; // Adjust this value to account for any fixed headers
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`bg-white w-64 h-screen overflow-y-auto py-4 ${isSticky ? 'shadow-lg' : ''}`}>
      <h2 className="text-xl font-bold px-4 mb-4">Menu Categories</h2>
      <nav>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => scrollToCategory(category)}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
              selectedCategory === category ? 'bg-gray-100 border-l-4 border-[#00A7A2]' : ''
            }`}
          >
            {category}
          </button>
        ))}
      </nav>
    </div>
  );
}
