'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 text-neutral-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`w-full text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-neutral-200 dark:border-neutral-800 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white'
            } rounded-sm px-3 py-2 transition-colors placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none disabled:bg-neutral-50 dark:disabled:bg-neutral-800 disabled:opacity-70 ${
              leftIcon ? 'pl-8' : ''
            } ${className}`}
            {...props}
          />
        </div>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
