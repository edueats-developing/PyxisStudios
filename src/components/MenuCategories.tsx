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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isManuallySelecting = useRef(false);
  const scrollEndTimeout = useRef<NodeJS.Timeout | null>(null);

  // Observer setup for auto-highlight during scrolling
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-120px 0px -70% 0px',
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (isManuallySelecting.current) return; // Allow manual clicks to override temporarily

      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (visibleEntry) {
        const newCategory = visibleEntry.target.id;
        setCurrentCategory(newCategory);
        onSelectCategory(newCategory);
      }
    }, observerOptions);

    categories.forEach((category) => {
      const element = document.getElementById(category);
      if (element) observerRef.current?.observe(element);
    });

    return () => observerRef.current?.disconnect();
  }, [categories, onSelectCategory]);

  // Function to detect when scrolling stops and reset observer control
  useEffect(() => {
    const handleScroll = () => {
      if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
      scrollEndTimeout.current = setTimeout(() => {
        isManuallySelecting.current = false;
        updateCategoryOnScrollEnd();
      }, 150); // Adjust delay for smooth detection
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateCategoryOnScrollEnd = () => {
    // Check if the user has scrolled to the top of the page
    if (window.scrollY === 0) {
      setCurrentCategory('all');
      onSelectCategory('all');
      return;
    }

    // Otherwise, find the visible category
    const visibleCategory = categories.find((category) => {
      const element = document.getElementById(category);
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });

    if (visibleCategory) {
      setCurrentCategory(visibleCategory);
      onSelectCategory(visibleCategory);
    }
  };

  const scrollToCategory = (category: string) => {
    isManuallySelecting.current = true;
    setCurrentCategory(category);
    onSelectCategory(category);

    if (category === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(category);
      if (element) {
        const offset = 124;
        const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }

    // Reset the manual selection flag after the scroll animation is complete
    if (scrollEndTimeout.current) clearTimeout(scrollEndTimeout.current);
    scrollEndTimeout.current = setTimeout(() => {
      isManuallySelecting.current = false;
      updateCategoryOnScrollEnd();
    }, 700); // Delay matches scroll animation
  };

  return (
    <div
      ref={menuRef}
      className="menu-categories w-[90%] bg-white transition-shadow duration-200 sticky top-[3.75rem] z-[15]"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 z-[10]">
        <nav className="flex flex-wrap gap-2 items-center min-h-[40px] justify-start">
          <button
            onClick={() => scrollToCategory('all')}
            className={`px-4 py-2 rounded-full hover:bg-gray-100 transition-colors ${
              currentCategory === 'all' ? 'bg-gray-100 border-2 border-[#00A7A2] text-[#00A7A2]' : 'border border-gray-200'
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