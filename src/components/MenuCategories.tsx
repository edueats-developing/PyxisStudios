'use client';

import { useEffect, useState, useRef } from 'react';

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
  const [currentCategory, setCurrentCategory] = useState(selectedCategory);
  const [isSticky, setIsSticky] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 60); // Account for navbar height
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Set up intersection observer for each category section
    const options = {
      root: null,
      rootMargin: '-120px 0px -70% 0px',
      threshold: 0
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setCurrentCategory(entry.target.id);
          onSelectCategory(entry.target.id);
        }
      });
    }, options);

    // Observe all category sections
    categories.forEach(category => {
      const element = document.getElementById(category);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [categories, onSelectCategory]);

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(category);
    if (element) {
      const offset = 124; // Account for navbar + categories bar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div 
      ref={menuRef}
      className="menu-categories w-[90%] bg-white transition-shadow duration-200 sticky top-[3.75rem] z-[45] ml-[50px]"
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <nav className="flex flex-wrap gap-2 items-center min-h-[40px] justify-start">
          <button
            onClick={() => {
              onSelectCategory('');
              setCurrentCategory('');
            }}
            className={`px-4 py-2 rounded-full hover:bg-gray-100 transition-colors ${
              !currentCategory ? 'bg-gray-100 border-2 border-[#00A7A2] text-[#00A7A2]' : 'border border-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => scrollToCategory(category)}
              className={`px-4 py-2 rounded-full hover:bg-gray-100 transition-colors ${
                currentCategory === category ? 'bg-gray-100 border-2 border-[#00A7A2] text-[#00A7A2]' : 'border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
