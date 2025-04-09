'use client';

import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from './DarkModeContext';

export default function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-full transition-colors ${
        darkMode
          ? 'bg-gray-700 text-yellow-400'
          : 'bg-gray-200 text-gray-700'
      }`}
      aria-label="Toggle dark mode"
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
    </button>
  );
}
