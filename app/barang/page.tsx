'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Layers,
  QrCode,
} from 'lucide-react';
import { Barang, UserSession } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { BarangDataTable } from '@/components/barang/BarangDataTable';
import { BarangCard } from '@/components/barang/BarangCard';
import { QrScannerModal } from '@/components/qr/QrScannerModal';
import { useToast } from '@/components/ui/Toast';

export default function BarangPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [items, setItems] = useState<Barang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [viewMode, setViewMode] = useState<'datatable' | 'grid'>('datatable');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error('Error fetching user:', err));
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      const res = await fetch('/api/barang');
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error('Error fetching barang:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const isScoped = currentUser?.role === 'KAKOM' || currentUser?.role === 'LABORAN';
  const canAddBarang =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'OPERATOR' ||
    currentUser?.role === 'LABORAN';

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <header className="pb-3 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Data Barang & Unit Fisik
            </h1>
            {isScoped && currentUser?.jurusan_kode && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Wilayah Akses: {currentUser.jurusan_kode}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Tabel DataTables inventaris unit aset fisik sekolah (format kode: BRG-[JURUSAN]-XXX-YYY) dengan fitur pencarian, sortir multi-kolom, pagination, dan QR Code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-sm p-0.5 bg-neutral-50 dark:bg-neutral-900 text-xs">
            <button
              onClick={() => setViewMode('datatable')}
              className={`px-2.5 py-1 rounded-xs flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                viewMode === 'datatable'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="DataTables View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">DataTables</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-xs flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kartu</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchItems}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            id="btn-scan-qr-barang-page"
            variant="outline"
            size="sm"
            onClick={() => setIsScannerOpen(true)}
            leftIcon={<QrCode className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />}
          >
            Scan QR
          </Button>

          {canAddBarang && (
            <Link href="/barang/tambah">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Tambah Barang
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {viewMode === 'datatable' ? (
        <BarangDataTable
          currentUser={currentUser}
          items={items}
          isLoading={isLoading}
          isError={isError}
          onRefresh={fetchItems}
          onDeleteSuccess={fetchItems}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <BarangCard
                key={item.id}
                barang={item}
                userRole={currentUser?.role}
                userJurusan={currentUser?.jurusan_kode}
              />
            ))}
          </div>
        </div>
      )}

      {/* QR Code Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
