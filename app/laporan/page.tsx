'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Package,
  Layers,
  Boxes,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Barang, StatsData } from '@/lib/types';
import { formatNumber, getKondisiBadgeStyle } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function LaporanPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [items, setItems] = useState<Barang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, barangRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/barang'),
      ]);

      const statsJson = await statsRes.json();
      const barangJson = await barangRes.json();

      if (statsJson.success) setStats(statsJson.data);
      if (barangJson.success && Array.isArray(barangJson.data)) setItems(barangJson.data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      showToast('Gagal memuat data laporan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleExportCSV = () => {
    if (items.length === 0) {
      showToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    const headers = ['Kode', 'Nama Barang', 'Kategori', 'Jumlah Unit', 'Kondisi', 'Tanggal Dibuat'];
    const rows = items.map((i) => [
      `"${i.kode}"`,
      `"${i.nama.replace(/"/g, '""')}"`,
      `"${i.kategori}"`,
      i.jumlah,
      `"${i.kondisi}"`,
      `"${i.created_at ? new Date(i.created_at).toLocaleDateString('id-ID') : ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-inventaris-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan CSV berhasil diunduh', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  // Group items by category
  const categoryCounts = items.reduce((acc, item) => {
    acc[item.kategori] = (acc[item.kategori] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const kondisiDisplayList = [
    { label: 'Baru', count: stats?.kondisiCount?.Baru ?? 0 },
    { label: 'Baik', count: stats?.kondisiCount?.Baik ?? 0 },
    { label: 'Rusak Ringan', count: stats?.kondisiCount?.RusakRingan ?? 0 },
    { label: 'Rusak Berat', count: stats?.kondisiCount?.RusakBerat ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              LAPORAN INVENTARIS
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Rekapitulasi total aset, kondisi barang, dan sebaran kategori stok.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Cetak
          </Button>
        </div>
      </header>

      {isLoading ? (
        <Loading message="Menghasilkan laporan inventaris..." />
      ) : (
        <div className="space-y-6">
          {/* Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Card>
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                <span>Total Jenis</span>
                <Package className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-mono font-bold text-neutral-900 dark:text-white mt-1">
                {stats?.totalBarang ?? 0}
              </div>
            </Card>

            <Card>
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                <span>Total Unit</span>
                <Boxes className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-mono font-bold text-neutral-900 dark:text-white mt-1">
                {formatNumber(stats?.totalUnits ?? stats?.totalBarang ?? 0)}
              </div>
            </Card>

            <Card>
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                <span>Kategori</span>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-mono font-bold text-neutral-900 dark:text-white mt-1">
                {stats?.totalKategori ?? 0}
              </div>
            </Card>

            <Card>
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                <span>Stok Kritis</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-1">
                {stats?.stokKritis?.length ?? 0}
              </div>
            </Card>
          </div>

          {/* Kondisi Breakdown */}
          <Card>
            <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-neutral-500" />
              Distribusi Kondisi Barang
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {kondisiDisplayList.map(({ label, count }) => {
                const style = getKondisiBadgeStyle(label);
                return (
                  <div
                    key={label}
                    className={`p-3 rounded-sm border ${style.border} ${style.bg} flex flex-col justify-between`}
                  >
                    <span className={`text-[11px] font-semibold ${style.text}`}>
                      {label}
                    </span>
                    <span className="text-lg font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                      {count} item
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Kategori Breakdown */}
          <Card>
            <h2 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-neutral-500" />
              Sebaran Kategori & Stok
            </h2>

            {Object.keys(categoryCounts).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(categoryCounts).map(([kategori, count]) => (
                  <div
                    key={kategori}
                    className="p-2.5 border border-neutral-200 dark:border-neutral-800 rounded-sm flex items-center justify-between text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {kategori}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                        {count} jenis
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">Belum ada data kategori.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
