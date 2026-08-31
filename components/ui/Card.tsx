'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
    subtle: 'bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800',
  };

  return (
    <div
      className={`rounded-sm p-4 text-neutral-900 dark:text-neutral-100 transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
