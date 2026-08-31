'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ChevronRight } from 'lucide-react';
import { NavItem, isRouteActive } from '@/lib/navigation-config';

interface MoreBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}

export const MoreBottomSheet: React.FC<MoreBottomSheetProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const pathname = usePathname();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="more-menu-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="more-menu-title"
    >
      {/* Menu Container: Mobile Bottom Sheet & Desktop Modal */}
      <div
        id="more-menu-sheet"
        className="w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-sm sm:rounded-sm shadow-xl overflow-hidden transition-all duration-200 ease-out animate-in fade-in-50 slide-in-from-bottom-6 sm:slide-in-from-bottom-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-sm" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3
              id="more-menu-title"
              className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight"
            >
              Menu Lainnya
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Pilihan fitur & pengaturan tambahan ({items.length} menu)
            </p>
          </div>
          <button
            id="btn-close-more-sheet"
            onClick={onClose}
            aria-label="Tutup Menu"
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Items List */}
        <div className="overflow-y-auto p-2 space-y-1 max-h-[60vh]">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(pathname, item.href);

            return (
              <Link
                key={item.id}
                id={`more-menu-item-${item.id}`}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between p-2.5 rounded-sm text-xs font-medium transition-all ${
                  active
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 font-semibold border-l-2 border-neutral-900 dark:border-neutral-100 pl-2'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-950 dark:hover:text-neutral-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-sm flex items-center justify-center transition-colors ${
                      active
                        ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                        : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active ? 'stroke-[2.2]' : 'stroke-[1.8]'
                      }`}
                    />
                  </div>
                  <div className="truncate text-left">
                    <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-normal">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-sm">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
                      active
                        ? 'text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-400 dark:text-neutral-600'
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
          <span>Manajemen Barang (8 Menu)</span>
          <span className="font-mono text-[10px]">Neon • Next.js</span>
        </div>
      </div>
    </div>
  );
};
