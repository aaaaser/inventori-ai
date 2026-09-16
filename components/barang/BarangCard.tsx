'use client';

import React from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Eye, QrCode, MapPin } from 'lucide-react';
import { Barang } from '@/lib/types';
import { Button } from '@/components/ui/Button';

interface BarangCardProps {
  barang: Barang;
  onDelete?: (barang: Barang) => void;
  userRole?: string;
  userJurusan?: string | null;
}

export const BarangCard: React.FC<BarangCardProps> = ({ barang, onDelete, userRole, userJurusan }) => {
  const isSuperAdminOrOperator = userRole === 'SUPER_ADMIN' || userRole === 'OPERATOR';
  const isLaboran = userRole === 'LABORAN';
  const canModify = isSuperAdminOrOperator || (isLaboran && (!userJurusan || barang.jurusan === userJurusan));
  const getKondisiBadge = (kondisi: string) => {
    switch (kondisi) {
      case 'Baru':
      case 'Baik':
      case 'BAIK':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      case 'Rusak Ringan':
      case 'RUSAK_RINGAN':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
      case 'Rusak Berat':
      case 'RUSAK_BERAT':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
      default:
        return 'text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    }
  };

  const getJurusanBadge = (jurusan?: string) => {
    switch (jurusan) {
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
          <div className="flex items-center gap-1.5 shrink-0">
            {barang.jurusan && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getJurusanBadge(barang.jurusan)}`}>
                {barang.jurusan}
              </span>
            )}
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-sm border ${getKondisiBadge(
                barang.kondisi
              )}`}
            >
              {barang.kondisi}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-mono text-neutral-800 dark:text-neutral-200 font-semibold">
            {barang.kode}
          </span>
          <span>·</span>
          <span>{barang.kategori}</span>
          {barang.ruangan && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                <MapPin className="w-3 h-3" />
                {barang.ruangan}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
        <Link
          href={`/barang/${barang.id}`}
          className="text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 flex items-center gap-1 font-medium"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Detail & QR</span>
        </Link>

        <div className="flex items-center gap-1.5">
          {canModify && (
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
          )}

          {canModify && onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(barang)}
              leftIcon={<Trash2 className="w-3 h-3" />}
              className="text-xs h-7 px-2.5"
            >
              Hapus
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
