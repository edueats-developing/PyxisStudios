'use client';

import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SettingsTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  actionCount?: number;
}

export default function SettingsTabs({ tabs, activeTab, onChange, actionCount = 0 }: SettingsTabsProps) {
  return (
    <div className="mb-6 border-b border-gray-200">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center px-4 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#00A7A2] text-[#00A7A2]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            {tab.id === 'restaurant' && actionCount > 0 && (
              <span className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {actionCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
