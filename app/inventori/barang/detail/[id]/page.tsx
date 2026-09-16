'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  Package,
  Layers,
  MapPin,
  Tag,
  Calendar,
  Wrench,
  AlertTriangle,
  QrCode as QrCodeIcon,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { AssetData, AssetGroupData, AssetMaintenanceData, UserSession } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';

export default function ScannedAssetDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [asset, setAsset] = useState<AssetData | null>(null);
  const [assetGroup, setAssetGroup] = useState<AssetGroupData | null>(null);
  const [maintenances, setMaintenances] = useState<AssetMaintenanceData[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    // Fetch Asset details
    if (params.id) {
      setIsLoading(true);
      fetch(`/api/assets/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setAsset(data.data);
            setAssetGroup(data.data.assetGroup || null);
            setMaintenances(data.data.maintenances || []);
          } else {
            setIsError(true);
            setErrorMessage(data.message || 'Data unit aset tidak ditemukan.');
          }
        })
        .catch((err) => {
          setIsError(true);
          setErrorMessage(err.message || 'Gagal memuat data');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [params.id]);

  const getKondisiBadge = (kondisi?: string) => {
    const k = (kondisi || '').toUpperCase().replace(/\s+/g, '_');
    switch (k) {
      case 'BAIK':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      case 'RUSAK_RINGAN':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
      case 'RUSAK_BERAT':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
      default:
        return 'text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'TERSEDIA':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      case 'DIPINJAM':
        return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
      case 'PERAWATAN':
      case 'PERBAIKAN':
        return 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800';
      case 'RUSAK':
      case 'TIDAK_AKTIF':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
      default:
        return 'text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    }
  };

  const getJurusanBadge = (kode?: string) => {
    switch (kode) {
      case 'RPL':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'ATPH':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'TBSM':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';
    }
  };

  if (isLoading) {
    return <Loading message="Memindai informasi aset..." className="py-16" />;
  }

  if (isError || !asset) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-neutral-900 dark:text-white">
          Aset Tidak Ditemukan
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {errorMessage || 'Kode QR tidak sesuai dengan unit aset manapun atau Anda tidak memiliki akses.'}
        </p>
        <Link href="/">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 p-2 sm:p-4">
      {/* Top Bar */}
      <header className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Link href="/barang">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Inventori
            </Button>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-white">
            <QrCodeIcon className="w-4 h-4 text-neutral-500" />
            <span>Hasil Pindai QR Code</span>
          </div>
        </div>

        {currentUser ? (
          <Link href={`/barang/${asset.id}`}>
            <Button variant="primary" size="sm">
              Buka Panel Pengelolaan
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="outline" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
              Masuk Akun
            </Button>
          </Link>
        )}
      </header>

      {/* Verified Asset Card */}
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                {asset.kode_barang}
              </span>
              {asset.jurusan_kode && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${getJurusanBadge(asset.jurusan_kode)}`}>
                  Jurusan {asset.jurusan_kode}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
              {asset.nama_barang}
            </h1>
            {assetGroup && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Jenis: <span className="font-mono font-medium">{assetGroup.kode_kelompok}</span> ({assetGroup.nama_barang})
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-sm border ${getStatusBadge(asset.status)}`}>
              {asset.status}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm border ${getKondisiBadge(asset.kondisi)}`}>
              {asset.kondisi}
            </span>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
            <span className="text-neutral-500 dark:text-neutral-400 block">Ruangan / Penempatan</span>
            <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              {asset.ruangan_nama || '-'}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
            <span className="text-neutral-500 dark:text-neutral-400 block">Nomor Seri</span>
            <span className="font-mono font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              {asset.nomor_seri || '-'}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
            <span className="text-neutral-500 dark:text-neutral-400 block">Merk & Model</span>
            <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-neutral-400" />
              {asset.merk ? `${asset.merk} ${asset.tipe || ''}`.trim() : '-'}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
            <span className="text-neutral-500 dark:text-neutral-400 block">Tahun & Sumber Dana</span>
            <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              {asset.tahun_perolehan || '-'} · {asset.sumber_dana || 'Dana BOS'}
            </span>
          </div>
        </div>

        {/* Maintenance summary */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-2">
            <Wrench className="w-3.5 h-3.5 text-purple-600" />
            Riwayat Pemeliharaan ({maintenances.length})
          </h3>

          {maintenances.length === 0 ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Unit dalam kondisi terawat, belum ada catatan perbaikan khusus.
            </p>
          ) : (
            <div className="space-y-2">
              {maintenances.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-sm bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {m.jenis_perawatan}
                    </span>
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                      Pelaksana: {m.pelaksana} · Status: {m.status}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400 shrink-0">
                    {m.tanggal_perawatan}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
