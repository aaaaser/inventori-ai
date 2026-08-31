'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserCircle, User as UserIcon, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';

export const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  // Close on click outside & ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    showToast('Berhasil keluar dari akun', 'info');
    router.push('/login');
  };

  const displayName = user?.name || 'Administrator';
  const displayEmail = user?.email || 'admin@gudang.local';
  const displayRole = user?.role || 'Super Admin';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        id="btn-header-profile"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu Profil Pengguna"
        aria-expanded={isOpen}
        className={`flex items-center gap-1.5 p-1.5 sm:px-2 sm:py-1.5 rounded-sm border transition-colors cursor-pointer select-none ${
          isOpen
            ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
        }`}
      >
        <UserCircle className="w-4 h-4 stroke-[2]" />
        <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate text-neutral-800 dark:text-neutral-200">
          {displayName.split(' ')[0]}
        </span>
      </button>

      {/* Profile Dropdown Menu */}
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/25 dark:bg-black/50 backdrop-blur-[1px] sm:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div
            id="header-profile-dropdown"
            className="fixed left-1/2 -translate-x-1/2 top-16 w-[calc(100vw-2rem)] max-w-xs sm:max-w-none sm:w-64 sm:absolute sm:left-auto sm:right-0 sm:translate-x-0 sm:top-full sm:mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
          >
            {/* User Info Header */}
            <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                  {displayName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {displayName}
                    </h4>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-mono truncate mt-0.5">
                    {displayEmail}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-sm border border-neutral-200 dark:border-neutral-700">
                      <Shield className="w-2.5 h-2.5" />
                      {displayRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-1.5 space-y-0.5">
              <Link
                id="menu-profile-link"
                href="/profil"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-sm transition-colors"
              >
                <UserIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <span>Profil Saya</span>
              </Link>

              <Link
                id="menu-settings-link"
                href="/pengaturan"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-sm transition-colors"
              >
                <Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <span>Pengaturan</span>
              </Link>
            </div>

            {/* Logout Action */}
            <div className="p-1.5 border-t border-neutral-100 dark:border-neutral-800">
              <button
                id="btn-logout"
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-sm transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
