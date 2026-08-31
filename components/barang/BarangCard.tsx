'use client';

import React from 'react';
import Link from 'next/link';
import { Edit2, Trash2, ChevronRight, Eye } from 'lucide-react';
import { Barang } from '@/lib/types';
import { Button } from '@/components/ui/Button';

interface BarangCardProps {
  barang: Barang;
  onDelete: (barang: Barang) => void;
}

export const BarangCard: React.FC<BarangCardProps> = ({ barang, onDelete }) => {
  const getKondisiBadge = (kondisi: string) => {
    switch (kondisi) {
      case 'Baru':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      case 'Baik':
        return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
      case 'Rusak Ringan':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
      case 'Rusak Berat':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
      default:
        return 'text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-3.5 sm:p-4 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700 flex flex-col justify-between gap-3 text-left">
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/barang/${barang.id}`}
            className="group flex-1 hover:underline focus:outline-none"
          >
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-black dark:group-hover:text-white leading-tight">
              {barang.nama}
            </h3>
          </Link>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-sm border shrink-0 ${getKondisiBadge(
              barang.kondisi
            )}`}
          >
            {barang.kondisi}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-mono text-neutral-700 dark:text-neutral-300 font-medium">
            {barang.kode}
          </span>
          <span>·</span>
          <span>{barang.kategori}</span>
          <span>·</span>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">{barang.jumlah} unit</span>
        </div>
      </div>

      <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
        <Link
          href={`/barang/${barang.id}`}
          className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1 font-medium"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Detail</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link href={`/barang/${barang.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="w-3 h-3" />}
              className="text-xs h-7 px-2.5"
            >
              Edit
            </Button>
          </Link>

          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(barang)}
            leftIcon={<Trash2 className="w-3 h-3" />}
            className="text-xs h-7 px-2.5"
          >
            Hapus
          </Button>
        </div>
      </div>
    </div>
  );
};
