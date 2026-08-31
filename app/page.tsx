'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  Boxes,
  ShieldCheck,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { StatsData } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Error fetching landing stats:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalBarang = stats?.totalBarang ?? 0;
  const barangBaik = stats?.barangBaik ?? stats?.kondisiCount?.Baik ?? 0;
  const barangRusak =
    stats?.barangRusak ??
    (stats?.kondisiCount ? stats.kondisiCount.RusakRingan + stats.kondisiCount.RusakBerat : 0);
  const barangBaru = stats?.barangBaru ?? stats?.kondisiCount?.Baru ?? 0;

  return (
    <div className="py-4 sm:py-8 space-y-8 sm:space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-xl mx-auto pt-2 sm:pt-4">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-xs font-mono text-neutral-800 dark:text-neutral-200">
          <Package className="w-3.5 h-3.5 stroke-[2]" />
          <span>SISTEM INVENTARIS</span>
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-white font-mono">
          Sistem Inventaris
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
          Kelola dan pantau inventaris dengan mudah, cepat, dan terorganisir.
        </p>

        {/* CTA Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            id="btn-landing-enter"
            href={isAuthenticated ? '/dashboard' : '/login'}
            className="w-full sm:w-auto"
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-6 py-2.5 font-medium flex items-center justify-center gap-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isAuthenticated ? 'Masuk ke Dashboard' : 'Masuk ke Aplikasi'}
            </Button>
          </Link>

          {isAuthenticated && (
            <Link href="/barang" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-4 py-2.5 font-medium"
              >
                Lihat Katalog Barang
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Dynamic Statistics Cards Section */}
      <section aria-label="Statistik Inventaris Realtime" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 font-mono">
              Ringkasan Data Inventaris
            </h2>
          </div>
          {isError && (
            <button
              onClick={fetchStats}
              className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Muat ulang</span>
            </button>
          )}
        </div>

        {/* Loading state skeleton */}
        {isLoading && !isError && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm animate-pulse"
              />
            ))}
          </div>
        )}

        {/* 4 Statistics Cards */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. Total Barang */}
            <Card
              id="stat-card-total"
              className="p-3.5 sm:p-4 flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                <span className="text-xs font-medium">Total Barang</span>
                <Package className="w-4 h-4 stroke-[1.8]" />
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-neutral-950 dark:text-white">
                  {totalBarang}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Item terdaftar
                </p>
              </div>
            </Card>

            {/* 2. Barang Baik */}
            <Card
              id="stat-card-baik"
              className="p-3.5 sm:p-4 flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                <span className="text-xs font-medium">Barang Baik</span>
                <CheckCircle2 className="w-4 h-4 stroke-[1.8] text-neutral-700 dark:text-neutral-300" />
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-neutral-950 dark:text-white">
                  {barangBaik}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Siap digunakan
                </p>
              </div>
            </Card>

            {/* 3. Barang Rusak */}
            <Card
              id="stat-card-rusak"
              className="p-3.5 sm:p-4 flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                <span className="text-xs font-medium">Barang Rusak</span>
                <AlertOctagon className="w-4 h-4 stroke-[1.8] text-neutral-700 dark:text-neutral-300" />
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-neutral-950 dark:text-white">
                  {barangRusak}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Ringan & Berat
                </p>
              </div>
            </Card>

            {/* 4. Barang Baru */}
            <Card
              id="stat-card-baru"
              className="p-3.5 sm:p-4 flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                <span className="text-xs font-medium">Barang Baru</span>
                <Sparkles className="w-4 h-4 stroke-[1.8] text-neutral-700 dark:text-neutral-300" />
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-neutral-950 dark:text-white">
                  {barangBaru}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Kondisi baru / &lt;30 hr
                </p>
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-sm bg-neutral-50/50 dark:bg-neutral-900/30 space-y-1.5">
          <div className="w-7 h-7 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm flex items-center justify-center text-neutral-900 dark:text-white mb-2">
            <Boxes className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
            Pencatatan Realtime
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Data stok dan kondisi barang diperbarui seketika dengan sinkronisasi database.
          </p>
        </div>

        <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-sm bg-neutral-50/50 dark:bg-neutral-900/30 space-y-1.5">
          <div className="w-7 h-7 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm flex items-center justify-center text-neutral-900 dark:text-white mb-2">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
            Navigasi Adaptif
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Bottom navigation fleksibel mendukung ekspansi 4 hingga 8+ menu tanpa hambatan.
          </p>
        </div>

        <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-sm bg-neutral-50/50 dark:bg-neutral-900/30 space-y-1.5">
          <div className="w-7 h-7 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm flex items-center justify-center text-neutral-900 dark:text-white mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
            Notifikasi & Keamanan
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Pusat notifikasi di header memberi tahu riwayat perubahan barang secara transparan.
          </p>
        </div>
      </section>

      {/* Footer info */}
      <footer className="pt-4 text-center text-xs text-neutral-400 font-mono border-t border-neutral-100 dark:border-neutral-900">
        Sistem Inventaris &copy; {new Date().getFullYear()} · Manajemen Aset & Logistik
      </footer>
    </div>
  );
}
