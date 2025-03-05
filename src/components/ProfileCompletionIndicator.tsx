'use client';

import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ProfileCompletionStep {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}

interface ProfileCompletionIndicatorProps {
  steps: ProfileCompletionStep[];
}

export default function ProfileCompletionIndicator({ steps }: ProfileCompletionIndicatorProps) {
  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
  
  const requiredIncompleteSteps = steps.filter(step => step.required && !step.completed);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Profile Completion</h3>
        <span className="text-sm font-medium text-gray-700">
          {completedSteps} of {totalSteps} completed
        </span>
      </div>
      
      <div className="p-6">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-[#00A7A2] h-2.5 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        
        {/* Completion percentage */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-medium text-gray-500">
            {completionPercentage}% Complete
          </span>
          
          {requiredIncompleteSteps.length > 0 ? (
            <span className="text-sm font-medium text-red-600 flex items-center">
              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
              {requiredIncompleteSteps.length} required {requiredIncompleteSteps.length === 1 ? 'item' : 'items'} missing
            </span>
          ) : (
            completedSteps === totalSteps && (
              <span className="text-sm font-medium text-green-600 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                All set!
              </span>
            )
          )}
        </div>
        
        {/* Steps list */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
                step.completed 
                  ? 'bg-green-100' 
                  : step.required 
                    ? 'bg-red-100' 
                    : 'bg-gray-100'
              }`}>
                {step.completed ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <div className={`h-2 w-2 rounded-full ${
                    step.required ? 'bg-red-600' : 'bg-gray-400'
                  }`}></div>
                )}
              </div>
              <span className={`ml-3 text-sm ${
                step.completed 
                  ? 'text-gray-700' 
                  : step.required 
                    ? 'text-red-700 font-medium' 
                    : 'text-gray-500'
              }`}>
                {step.label}
                {step.required && !step.completed && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
