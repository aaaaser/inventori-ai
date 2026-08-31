'use client';

import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Belum ada barang',
  description = 'Tambahkan barang pertama Anda untuk mulai mengelola inventaris.',
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-sm bg-neutral-50/50 dark:bg-neutral-900/30">
      <div className="w-10 h-10 rounded-sm bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 mb-3">
        {icon || <PackageOpen className="w-5 h-5" />}
      </div>
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
