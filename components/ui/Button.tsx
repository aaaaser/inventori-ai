'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white rounded-sm select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-3.5 py-2 gap-2 h-9',
    lg: 'text-base px-4 py-2.5 gap-2.5 h-10',
  };

  const variantStyles = {
    primary:
      'bg-black text-white hover:bg-neutral-800 active:bg-neutral-900 border border-black dark:bg-white dark:text-black dark:border-white dark:hover:bg-neutral-200',
    secondary:
      'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-700',
    outline:
      'bg-transparent text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-300 dark:text-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800/50',
    danger:
      'bg-white text-red-600 border border-red-200 hover:bg-red-50 active:bg-red-100 dark:bg-neutral-900 dark:text-red-400 dark:border-red-900/60 dark:hover:bg-red-950/30',
    ghost:
      'bg-transparent text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 border border-transparent dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
