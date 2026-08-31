'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, CheckCheck, Package, RefreshCw, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatsData, AppNotification } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { formatRelativeTime } from '@/lib/utils';

export default function NotifikasiPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, notifsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/notifications'),
      ]);

      const statsJson = await statsRes.json();
      const notifsJson = await notifsRes.json();

      if (statsJson.success) setStats(statsJson.data);
      if (notifsJson.success && notifsJson.data) {
        setNotifications(notifsJson.data.notifications || []);
        setUnreadCount(notifsJson.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notification data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        showToast('Semua notifikasi ditandai telah dibaca', 'success');
      }
    } catch (err) {
      showToast('Gagal memperbarui status notifikasi', 'error');
    }
  };

  const handleMarkItemRead = async (notifId: number) => {
    try {
      await fetch(`/api/notifications/${notifId}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              NOTIFIKASI SISTEM
            </h1>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-sm">
                {unreadCount} baru
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 ml-6">
            Peringatan stok menipis, penambahan barang, dan aktivitas inventaris.
          </p>
        </div>

        <div className="flex items-center gap-2 ml-6 sm:ml-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
            >
              Tandai Semua Terbaca
            </Button>
          )}
        </div>
      </header>

      {/* Notifications List */}
      <div className="space-y-3">
        {/* Stok Menipis Items */}
        {stats?.stokKritis && stats.stokKritis.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider font-mono">
              Peringatan Stok Kritis ({stats.stokKritis.length})
            </h2>
            {stats.stokKritis.map((item) => (
              <Card
                key={item.id}
                className="p-3.5 border-l-4 border-l-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/30 dark:bg-amber-950/10"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-sm bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-sm font-semibold">
                        Stok Menipis
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {item.kode}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                      {item.nama}
                    </h3>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                      Tersisa hanya <strong className="text-amber-700 dark:text-amber-400">{item.jumlah} unit</strong> dalam kategori {item.kategori}. Segera lakukan restock.
                    </p>
                  </div>
                </div>

                <Link href={`/barang/${item.id}/edit`}>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs whitespace-nowrap">
                    Update Stok
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* Activity & System Notifications */}
        <div className="space-y-2 pt-2">
          <h2 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider font-mono">
            Aktivitas Terkini
          </h2>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm animate-pulse"
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-6 text-center text-xs text-neutral-500 space-y-1">
              <CheckCheck className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                Tidak ada aktivitas baru
              </p>
              <p>Riwayat perubahan barang akan tercatat di sini.</p>
            </Card>
          ) : (
            notifications.map((notif) => (
              <Card
                key={notif.id}
                onClick={() => handleMarkItemRead(notif.id)}
                className={`p-3.5 border-l-4 transition-all cursor-pointer ${
                  notif.is_read
                    ? 'border-l-neutral-300 dark:border-l-neutral-700 opacity-80'
                    : 'border-l-neutral-950 dark:border-l-neutral-100 bg-neutral-50/50 dark:bg-neutral-900/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-sm shrink-0 ${
                      notif.is_read
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                        : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-sm font-semibold">
                          Aktivitas
                        </span>
                        {!notif.is_read && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-sm">
                            BARU
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                      {notif.title}
                    </h3>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
