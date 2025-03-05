'use client';

import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface SettingsCardProps {
  title: string;
  children: React.ReactNode;
  saveLabel?: string;
  onSave?: () => Promise<void>;
  footer?: React.ReactNode;
  saveDisabled?: boolean;
}

export default function SettingsCard({ 
  title, 
  children, 
  saveLabel = 'Save Changes', 
  onSave, 
  footer,
  saveDisabled = false
}: SettingsCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!onSave || isSaving || saveDisabled) return;
    
    setIsSaving(true);
    try {
      await onSave();
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      
      <div className="p-6">
        {children}
      </div>
      
      {onSave && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            {showSaveSuccess && (
              <span className="flex items-center text-green-600 text-sm">
                <CheckIcon className="h-4 w-4 mr-1" />
                Changes saved
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || saveDisabled}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${saveDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#00A7A2] hover:bg-[#007b77] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A7A2]'}
              ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              saveLabel
            )}
          </button>
        </div>
      )}
      
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}
