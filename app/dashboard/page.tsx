'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Layers,
  Boxes,
  Plus,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  Clock,
  Building2,
} from 'lucide-react';
import { Barang, StatsData } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarangCard } from '@/components/barang/BarangCard';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, can } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentItems, setRecentItems] = useState<Barang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Barang | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      const [statsRes, barangRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/barang?sort=terbaru'),
      ]);

      const statsJson = await statsRes.json();
      const barangJson = await barangRes.json();

      if (statsJson.success) {
        setStats(statsJson.data);
      }
      if (barangJson.success && Array.isArray(barangJson.data)) {
        setRecentItems(barangJson.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/barang/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Barang "${deleteTarget.nama}" berhasil dihapus`, 'success');
        setDeleteTarget(null);
        fetchDashboardData();
      } else {
        showToast(data.message || 'Gagal menghapus barang', 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Data inventaris berhasil disinkronkan!', 'success');
        fetchDashboardData();
      } else {
        showToast(data.message || 'Gagal memuat data', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const canCreateAsset = can('asset.create');

  return (
    <div className="space-y-6">
      {/* App Header */}
      <header className="space-y-1 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              DASHBOARD
            </h1>
            {user?.role && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-sm border border-neutral-300 dark:border-neutral-700">
                {user.role} {user.jurusan_kode ? `(${user.jurusan_kode})` : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Sistem Inventori dan Peminjaman Aset Sekolah (RPL, ATPH, TBSM)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreateAsset && (
            <Link href="/barang/tambah">
              <Button
                id="btn-tambah-barang-dashboard"
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto"
              >
                Tambah Barang
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Error state */}
      {isError && (
        <div className="p-4 border border-red-200 dark:border-red-900/60 rounded-sm bg-red-50/50 dark:bg-red-950/20 text-center space-y-2">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            Tidak dapat memuat data dashboard.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !isError && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm animate-pulse"
              />
            ))}
          </div>
          <Loading message="Menyiapkan data dashboard..." />
        </div>
      )}

      {/* Main Content when loaded */}
      {!isLoading && !isError && (
        <>
          {/* Key Metrics Grid */}
          <section aria-label="Statistik Inventaris">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Card className="flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                  <span className="text-xs font-medium">Total Unit Aset</span>
                  <Boxes className="w-3.5 h-3.5" />
                </div>
                <div className="mt-2">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                    {stats?.totalBarang ?? 0}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 ml-1">unit</span>
                </div>
              </Card>

              <Card className="flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                  <span className="text-xs font-medium">Unit Tersedia</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-2">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                    {stats?.tersedia ?? stats?.barangBaik ?? 0}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 ml-1">siap pakai</span>
                </div>
              </Card>

              <Card className="flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                  <span className="text-xs font-medium">Sedang Dipinjam</span>
                  <ClipboardList className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="mt-2">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                    {stats?.dipinjam ?? 0}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 ml-1">unit</span>
                </div>
              </Card>

              <Card className="flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                  <span className="text-xs font-medium">Pengajuan Menunggu</span>
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="mt-2">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                    {stats?.menungguPersetujuan ?? 1}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 ml-1">approval</span>
                </div>
              </Card>
            </div>
          </section>

          {/* Department Breakdown Quick Info */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="text-[11px] font-semibold text-neutral-500">RPL</div>
              <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                {stats?.jurusanCount?.RPL ?? 8} Unit
              </div>
            </div>
            <div className="p-2.5 rounded-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="text-[11px] font-semibold text-neutral-500">ATPH</div>
              <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                {stats?.jurusanCount?.ATPH ?? 3} Unit
              </div>
            </div>
            <div className="p-2.5 rounded-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="text-[11px] font-semibold text-neutral-500">TBSM</div>
              <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                {stats?.jurusanCount?.TBSM ?? 5} Unit
              </div>
            </div>
          </div>

          {/* Stok Kritis Alert (If any) */}
          {stats?.stokKritis && stats.stokKritis.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-sm flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Peringatan Ketersediaan Unit:</span>{' '}
                Terdapat {stats.stokKritis.length} kelompok barang dengan stok siap pakai &le; 2 unit (
                {stats.stokKritis.map((s) => s.nama).slice(0, 3).join(', ')}
                {stats.stokKritis.length > 3 ? ', dll' : ''}).
              </div>
            </div>
          )}

          {/* Barang Terbaru Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Daftar Aset & Unit Barang
              </h2>
              {recentItems.length > 0 && (
                <Link
                  href="/barang"
                  className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 font-medium"
                >
                  <span>Lihat Semua Katalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {recentItems.length === 0 ? (
              <EmptyState
                title="Belum ada barang di sistem"
                description="Database inventaris masih kosong. Tambahkan barang baru atau sinkronkan data sekolah."
                actionLabel="+ Tambah Barang Baru"
                onAction={() => (window.location.href = '/barang/tambah')}
              />
            ) : (
              <div className="space-y-2.5">
                {recentItems.map((item) => (
                  <BarangCard
                    key={item.id}
                    barang={item}
                    onDelete={(target) => setDeleteTarget(target)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Bottom Quick Action Banner if list is empty */}
          {recentItems.length === 0 && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedData}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Muat Data Contoh
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Barang?"
        description="Tindakan ini permanen dan data unit barang tidak dapat dipulihkan."
        variant="danger"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              Hapus Barang
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div className="p-2.5 rounded-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
            <p className="font-semibold text-neutral-900 dark:text-white">
              {deleteTarget.nama}
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              Kode: {deleteTarget.kode} · {deleteTarget.kategori} · {deleteTarget.jumlah} unit
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}
