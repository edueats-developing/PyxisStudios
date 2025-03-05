'use client';

import React, { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export default function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  icon,
  children
}: FormFieldProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
      </div>
      
      <div className="relative rounded-md">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <div className={icon ? 'pl-10' : ''}>
          {children}
        </div>
      </div>
      
      {hint && (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
}

// Input component with consistent styling
export function Input({
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00A7A2] focus:ring-[#00A7A2] sm:text-sm ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      } ${className}`}
      {...props}
    />
  );
}

// Select component with consistent styling
export function Select({
  id,
  name,
  value,
  onChange,
  required = false,
  disabled = false,
  children,
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00A7A2] focus:ring-[#00A7A2] sm:text-sm ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// Textarea component with consistent styling
export function Textarea({
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  rows = 3,
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      rows={rows}
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00A7A2] focus:ring-[#00A7A2] sm:text-sm ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      } ${className}`}
      {...props}
    />
  );
}

// Checkbox component with consistent styling
export function Checkbox({
  id,
  name,
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`h-4 w-4 rounded border-gray-300 text-[#00A7A2] focus:ring-[#00A7A2] ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        } ${className}`}
        {...props}
      />
      <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
}
