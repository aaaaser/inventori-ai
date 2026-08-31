'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  Server,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  RefreshCw,
  Terminal,
  User,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';

export default function PengaturanPage() {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    mode: string;
    totalRecords?: number;
    error?: string;
  } | null>(null);

  const [isChecking, setIsChecking] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { showToast } = useToast();

  const checkDb = async () => {
    try {
      setIsChecking(true);
      const res = await fetch('/api/db-status');
      const json = await res.json();
      if (json.success) {
        setDbStatus(json.data);
      }
    } catch (err) {
      console.error('Error checking db:', err);
      showToast('Gagal memeriksa status database', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkDb();
  }, []);

  const handleSeed = async () => {
    try {
      setIsResetting(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Sample data berhasil dimuat', 'success');
        checkDb();
      } else {
        showToast('Gagal memuat sample data', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportJson = async () => {
    try {
      setIsExporting(true);
      const res = await fetch('/api/barang');
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `backup_barang_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        showToast('Data barang berhasil diexport ke JSON', 'success');
      } else {
        showToast('Gagal mengunduh data barang', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
          PENGATURAN & SISTEM
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Informasi teknologi, koneksi database Neon, dan manajemen data.
        </p>
      </header>

      {/* Account Info Card */}
      {user && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            Akun Aktif
          </h2>
          <Card className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-bold text-xs font-mono">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {user.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-sm border border-neutral-200 dark:border-neutral-700">
                    <Shield className="w-2.5 h-2.5" />
                    {user.role}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{user.email}</p>
              </div>
            </div>

            <Link href="/profil">
              <Button variant="outline" size="sm" className="text-xs" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Buka Profil
              </Button>
            </Link>
          </Card>
        </section>
      )}

      {/* Database Connection Status Card */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Status Database
        </h2>
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Neon PostgreSQL / Drizzle
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {dbStatus?.mode || 'Memeriksa status database...'}
                </p>
              </div>
            </div>

            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-sm border shrink-0 flex items-center gap-1 ${
                dbStatus?.connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
              }`}
            >
              {dbStatus?.connected ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Neon Terhubung</span>
                </>
              ) : (
                <>
                  <Server className="w-3 h-3 text-neutral-500" />
                  <span>Local Memory Ready</span>
                </>
              )}
            </span>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">
              Total Record: <strong className="text-neutral-900 dark:text-white">{dbStatus?.totalRecords ?? 0}</strong>
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={checkDb}
              isLoading={isChecking}
              leftIcon={<RefreshCw className="w-3 h-3" />}
              className="text-xs h-7 px-2.5"
            >
              Cek Koneksi
            </Button>
          </div>
        </Card>
      </section>

      {/* Data Management Actions */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Kelola & Backup Data
        </h2>
        <Card className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              isLoading={isExporting}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="justify-start text-xs h-9"
            >
              Export Data (JSON Backup)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              isLoading={isResetting}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="justify-start text-xs h-9"
            >
              Reset / Seed Sample Data
            </Button>
          </div>
        </Card>
      </section>

      {/* Tech Stack Info */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Tech Stack Aplikasi
        </h2>
        <Card className="p-4 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2 text-neutral-600 dark:text-neutral-300">
            <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-sm border border-neutral-200 dark:border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">Framework</span>
              <strong className="text-neutral-900 dark:text-white">Next.js App Router</strong>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-sm border border-neutral-200 dark:border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">Language & Styling</span>
              <strong className="text-neutral-900 dark:text-white">TypeScript & Tailwind CSS</strong>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-sm border border-neutral-200 dark:border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">Database</span>
              <strong className="text-neutral-900 dark:text-white">Neon PostgreSQL</strong>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-sm border border-neutral-200 dark:border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">ORM</span>
              <strong className="text-neutral-900 dark:text-white">Drizzle ORM</strong>
            </div>
          </div>
        </Card>
      </section>

      {/* Deploy to Vercel Guide */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Petunjuk Deploy ke Vercel & Neon
        </h2>
        <Card className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>1. Hubungkan Neon Database:</span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 pl-5 leading-relaxed">
              Buat database baru di <span className="font-mono text-black dark:text-white">console.neon.tech</span>, salin Connection String PostgreSQL Anda, lalu set environment variable:
            </p>
            <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-sm font-mono text-[11px] text-neutral-800 dark:text-neutral-200 overflow-x-auto">
              DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>2. Push Migrasi Schema:</span>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-sm font-mono text-[11px] text-neutral-800 dark:text-neutral-200 overflow-x-auto">
              npx drizzle-kit push
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>3. Deploy ke Vercel:</span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 pl-5 leading-relaxed">
              Import repository ke Vercel, tambahkan variable <span className="font-mono text-black dark:text-white">DATABASE_URL</span> di menu <em>Settings &gt; Environment Variables</em>, lalu klik <strong>Deploy</strong>.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
