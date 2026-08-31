'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ChevronRight, Package, ArrowUpRight } from 'lucide-react';
import { AppNotification } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside & ESC
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

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-all-read' }),
      });
      const json = await res.json();
      if (json.success) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        showToast('Semua notifikasi ditandai dibaca', 'success');
      }
    } catch (err) {
      showToast('Gagal menandai notifikasi', 'error');
    }
  };

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      try {
        await fetch(`/api/notifications/${notif.id}/read`, { method: 'POST' });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.warn('Failed to mark read:', err);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="btn-header-notifications"
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Buka Notifikasi"
        aria-expanded={isOpen}
        className={`relative p-2 rounded-sm border transition-colors cursor-pointer select-none ${
          isOpen
            ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
        }`}
      >
        <Bell className="w-4 h-4 stroke-[2]" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            id="header-notification-badge"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-[10px] font-mono font-bold rounded-sm flex items-center justify-center border-2 border-white dark:border-neutral-950 shadow-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown / Popup */}
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/25 dark:bg-black/50 backdrop-blur-[1px] sm:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div
            id="header-notification-dropdown"
            className="fixed left-1/2 -translate-x-1/2 top-16 w-[calc(100vw-2rem)] max-w-sm sm:max-w-none sm:w-96 sm:absolute sm:left-auto sm:right-0 sm:translate-x-0 sm:top-full sm:mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
          >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                Notifikasi
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-sm">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai dibaca</span>
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
            {isLoading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                Memuat notifikasi...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400 space-y-1">
                <Bell className="w-5 h-5 mx-auto text-neutral-300 dark:text-neutral-600 mb-1" />
                <p className="font-medium text-neutral-600 dark:text-neutral-300">
                  Tidak ada notifikasi
                </p>
                <p className="text-[11px]">Semua aktivitas terbaru akan muncul di sini.</p>
              </div>
            ) : (
              notifications.slice(0, 6).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3 text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                    notif.is_read
                      ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40 opacity-75'
                      : 'bg-neutral-50/70 dark:bg-neutral-800/30 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-sm shrink-0 mt-0.5 ${
                      notif.is_read
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                        : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          notif.is_read
                            ? 'font-medium text-neutral-700 dark:text-neutral-300'
                            : 'font-bold text-neutral-900 dark:text-white'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.is_read && (
                    <span className="w-1.5 h-1.5 bg-neutral-900 dark:bg-neutral-100 rounded-sm shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
            <Link
              href="/notifikasi"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:underline flex items-center gap-1 px-2 py-1"
            >
              <span>Lihat semua notifikasi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[10px] text-neutral-400 font-mono px-2">
              {notifications.length} item
            </span>
          </div>
          </div>
        </>
      )}
    </div>
  );
};
