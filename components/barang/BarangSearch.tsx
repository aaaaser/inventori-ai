'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface BarangSearchProps {
  search: string;
  onSearchChange: (val: string) => void;
  kategori: string;
  onKategoriChange: (val: string) => void;
  kondisi: string;
  onKondisiChange: (val: string) => void;
  sort: string;
  onSortChange: (val: string) => void;
  kategoriList: string[];
  totalResults: number;
}

export const BarangSearch: React.FC<BarangSearchProps> = ({
  search,
  onSearchChange,
  kategori,
  onKategoriChange,
  kondisi,
  onKondisiChange,
  sort,
  onSortChange,
  kategoriList,
  totalResults,
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  const kategoriOptions = [
    { value: 'all', label: 'Semua Kategori' },
    ...kategoriList.map((k) => ({ value: k, label: k })),
  ];

  const kondisiOptions = [
    { value: 'all', label: 'Semua Kondisi' },
    { value: 'Baru', label: 'Baru' },
    { value: 'Baik', label: 'Baik' },
    { value: 'Rusak Ringan', label: 'Rusak Ringan' },
    { value: 'Rusak Berat', label: 'Rusak Berat' },
  ];

  const sortOptions = [
    { value: 'terbaru', label: 'Paling Baru Ditambahkan' },
    { value: 'nama_asc', label: 'Nama (A - Z)' },
    { value: 'nama_desc', label: 'Nama (Z - A)' },
    { value: 'jumlah_desc', label: 'Stok Terbanyak' },
    { value: 'jumlah_asc', label: 'Stok Paling Sedikit' },
  ];

  const hasActiveFilters = search || (kategori && kategori !== 'all') || (kondisi && kondisi !== 'all');

  const handleReset = () => {
    onSearchChange('');
    onKategoriChange('all');
    onKondisiChange('all');
  };

  return (
    <div className="space-y-2.5">
      {/* Main Search Bar & Filter Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama, kode, atau kategori barang..."
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
        <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <Select
              label="Kategori"
              value={kategori}
              onChange={(e) => onKategoriChange(e.target.value)}
              options={kategoriOptions}
              className="text-xs h-8"
            />
          </div>

          <div>
            <Select
              label="Kondisi"
              value={kondisi}
              onChange={(e) => onKondisiChange(e.target.value)}
              options={kondisiOptions}
              className="text-xs h-8"
            />
          </div>

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
            <div className="sm:col-span-3 flex justify-end">
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
          Menampilkan <strong className="text-neutral-900 dark:text-white">{totalResults}</strong> barang
        </span>
      </div>
    </div>
  );
};
