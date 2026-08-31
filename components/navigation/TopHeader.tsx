'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { useAuth } from '@/lib/auth-context';

export const TopHeader: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Don't show top header on pure landing page / if landing page has its own hero layout,
  // but if user is in authenticated app pages or wants to navigate, render header.
  const isLandingPage = pathname === '/';
  const isLoginPage = pathname === '/login';

  if (isLandingPage || isLoginPage) {
    return null;
  }

  return (
    <header
      id="top-app-header"
      className="sticky top-0 z-30 w-full bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: Brand Name & Logo */}
        <Link
          href={isAuthenticated ? '/dashboard' : '/'}
          className="flex items-center gap-2 group cursor-pointer select-none"
        >
          <div className="w-7 h-7 rounded-sm bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shadow-xs group-hover:opacity-90 transition-opacity">
            <Package className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
              SISTEM INVENTARIS
            </span>
          </div>
        </Link>

        {/* Right: Notification and Profile */}
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};
