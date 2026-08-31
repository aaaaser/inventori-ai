'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  navigationItems,
  getPartitionedNavigation,
  isRouteActive,
} from '@/lib/navigation-config';
import { MoreBottomSheet } from './MoreBottomSheet';

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Hide on Landing Page (/) and Login Page (/login)
  if (pathname === '/' || pathname === '/login') {
    return null;
  }

  const { primaryItems, moreItems, hasMore } = getPartitionedNavigation(navigationItems);

  // Check if current route matches any of the 'More' items
  const isMoreActive = moreItems.some((item) => isRouteActive(pathname, item.href));

  return (
    <>
      <nav
        id="bottom-navigation-bar"
        aria-label="Navigasi Utama"
        className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 pointer-events-none flex justify-center"
      >
        <div className="pointer-events-auto w-full max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-sm shadow-md px-1.5 py-1.5 flex items-center justify-between gap-1">
          {/* Primary Navigation Items (4 Menu Utama) */}
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(pathname, item.href);

            return (
              <Link
                key={item.id}
                id={`bottom-nav-${item.id}`}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 sm:px-2 rounded-sm transition-all text-[11px] font-medium select-none whitespace-nowrap ${
                  active
                    ? 'text-neutral-950 dark:text-neutral-50 font-semibold bg-neutral-100 dark:bg-neutral-800 shadow-[inset_0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-4 h-4 mb-0.5 ${
                      active ? 'stroke-[2.2]' : 'stroke-[1.8]'
                    }`}
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-bold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-sm leading-tight">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="leading-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* More Menu Button (Menampilkan sisa 4 menu tambahan) */}
          {hasMore && (
            <button
              id="bottom-nav-more"
              type="button"
              onClick={() => setIsMoreOpen(true)}
              aria-label="Buka Menu Lainnya"
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 sm:px-2 rounded-sm transition-all text-[11px] font-medium select-none whitespace-nowrap cursor-pointer ${
                isMoreActive || isMoreOpen
                  ? 'text-neutral-950 dark:text-neutral-50 font-semibold bg-neutral-100 dark:bg-neutral-800'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <ChevronRight
                  className={`w-4 h-4 mb-0.5 transition-transform ${
                    isMoreOpen ? 'rotate-90' : ''
                  } ${isMoreActive || isMoreOpen ? 'stroke-[2.2]' : 'stroke-[1.8]'}`}
                />
                {isMoreActive && (
                  <span className="absolute -top-0.5 -right-1.5 w-1.5 h-1.5 bg-neutral-900 dark:bg-neutral-100 rounded-sm ring-2 ring-white dark:ring-neutral-900" />
                )}
              </div>
              <span className="leading-tight flex items-center gap-0.5">
                <span className="text-neutral-400 text-[10px]">›</span>
                More
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Bottom Sheet / Popover for Additional Menus */}
      <MoreBottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        items={moreItems}
      />
    </>
  );
};
