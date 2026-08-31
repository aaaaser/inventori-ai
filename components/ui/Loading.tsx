'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Memuat data...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center space-y-2.5 ${className}`}>
      <Loader2 className="w-5 h-5 animate-spin text-neutral-800 dark:text-neutral-200" />
      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{message}</p>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 rounded-sm bg-white dark:bg-neutral-900 animate-pulse space-y-2.5">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-xs w-1/3" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-xs w-16" />
      </div>
      <div className="h-3 bg-neutral-100 dark:bg-neutral-800/60 rounded-xs w-1/2" />
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/60 flex justify-end gap-2">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-xs w-12" />
        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-xs w-12" />
      </div>
    </div>
  );
};
