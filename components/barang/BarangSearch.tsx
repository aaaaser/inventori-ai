'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface BarangSearchProps {
  search: string;
  onSearchChange: (val: string) => void;
  kondisi: string;
  onKondisiChange: (val: string) => void;
  status?: string;
  onStatusChange?: (val: string) => void;
  jurusan?: string;
  onJurusanChange?: (val: string) => void;
  sort: string;
  onSortChange: (val: string) => void;
  totalResults: number;
  userJurusan?: string | null;
  isScopedUser?: boolean;
}

export const BarangSearch: React.FC<BarangSearchProps> = ({
  search,
  onSearchChange,
  kondisi,
  onKondisiChange,
  status = 'all',
  onStatusChange,
  jurusan = 'all',
  onJurusanChange,
  sort,
  onSortChange,
  totalResults,
  userJurusan,
  isScopedUser = false,
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  const jurusanOptions = [
    { value: 'all', label: 'Semua Jurusan' },
    { value: 'RPL', label: 'RPL (Rekayasa Perangkat Lunak)' },
    { value: 'ATPH', label: 'ATPH (Agribisnis Tanaman Pangan & Hortikultura)' },
    { value: 'TBSM', label: 'TBSM (Teknik & Bisnis Sepeda Motor)' },
  ];

  const kondisiOptions = [
    { value: 'all', label: 'Semua Kondisi' },
    { value: 'Baik', label: 'Baik' },
    { value: 'Rusak Ringan', label: 'Rusak Ringan' },
    { value: 'Rusak Berat', label: 'Rusak Berat' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'TERSEDIA', label: 'Tersedia' },
    { value: 'DIPINJAM', label: 'Dipinjam' },
    { value: 'PERBAIKAN', label: 'Perbaikan / Maintenance' },
  ];

  const sortOptions = [
    { value: 'terbaru', label: 'Paling Baru Ditambahkan' },
    { value: 'nama_asc', label: 'Nama Barang (A - Z)' },
    { value: 'nama_desc', label: 'Nama Barang (Z - A)' },
    { value: 'terlama', label: 'Paling Lama' },
  ];

  const hasActiveFilters =
    search ||
    (kondisi && kondisi !== 'all') ||
    (status && status !== 'all') ||
    (jurusan && jurusan !== 'all');

  const handleReset = () => {
    onSearchChange('');
    onKondisiChange('all');
    if (onStatusChange) onStatusChange('all');
    if (onJurusanChange) onJurusanChange('all');
  };

  return (
    <div className="space-y-2.5">
      {/* Main Search Bar & Filter Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari kode unit (BRG-RPL-001-001), nama barang, ruangan, dsb..."
            leftIcon={<Search className="w-4 h-4 text-neutral-400" />}
            className="w-full text-xs h-9"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-9 px-3 rounded-sm border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
            showFilters || hasActiveFilters
              ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
              : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-800'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          {!isScopedUser && onJurusanChange && (
            <div>
              <Select
                label="Jurusan"
                value={jurusan}
                onChange={(e) => onJurusanChange(e.target.value)}
                options={jurusanOptions}
                className="text-xs h-8"
              />
            </div>
          )}

          <div>
            <Select
              label="Kondisi"
              value={kondisi}
              onChange={(e) => onKondisiChange(e.target.value)}
              options={kondisiOptions}
              className="text-xs h-8"
            />
          </div>

          {onStatusChange && (
            <div>
              <Select
                label="Status Unit"
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                options={statusOptions}
                className="text-xs h-8"
              />
            </div>
          )}

          <div>
            <Select
              label="Urutkan"
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              options={sortOptions}
              className="text-xs h-8"
            />
          </div>

          {hasActiveFilters && (
            <div className="sm:col-span-2 md:col-span-4 flex justify-end">
              <button
                onClick={handleReset}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Result Count Status */}
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-0.5">
        <span>
          Menampilkan <strong className="text-neutral-900 dark:text-white">{totalResults}</strong> unit aset terdaftar
        </span>
        {isScopedUser && userJurusan && (
          <span className="text-[11px] font-mono font-medium text-blue-600 dark:text-blue-400">
            Wilayah Akses: {userJurusan}
          </span>
        )}
      </div>
    </div>
  );
};

