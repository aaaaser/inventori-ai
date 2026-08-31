'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Package,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Barang } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';

export default function DetailBarangPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [barang, setBarang] = useState<Barang | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      const res = await fetch(`/api/barang/${params.id}`);
      const data = await res.json();

      if (data.success && data.data) {
        setBarang(data.data);
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchDetail();
    }
  }, [params.id]);

  const handleDeleteConfirm = async () => {
    if (!barang) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/barang/${barang.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Barang "${barang.nama}" berhasil dihapus`, 'success');
        setIsDeleteDialogOpen(false);
        router.push('/barang');
      } else {
        showToast(data.message || 'Gagal menghapus barang', 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateStr));
    } catch {
      return String(dateStr);
    }
  };

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

  if (isLoading) {
    return <Loading message="Memuat detail barang..." className="py-16" />;
  }

  if (isError || !barang) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-10 h-10 rounded-sm bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Data Barang Tidak Ditemukan
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
          Barang yang Anda cari mungkin telah dihapus atau URL tidak valid.
        </p>
        <Link href="/barang">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Kembali ke Daftar Barang
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="pb-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/barang">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Kembali
            </Button>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Detail Barang
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/barang/${barang.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Hapus
          </Button>
        </div>
      </header>

      {/* Main Info Card */}
      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
              {barang.kode}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
              {barang.nama}
            </h2>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-sm border shrink-0 ${getKondisiBadge(
              barang.kondisi
            )}`}
          >
            {barang.kondisi}
          </span>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
            <span className="text-neutral-500 dark:text-neutral-400 block">Kategori</span>
            <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              {barang.kategori}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
            <span className="text-neutral-500 dark:text-neutral-400 block">Jumlah Stok</span>
            <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-neutral-400" />
              {barang.jumlah} Unit
            </span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
            <span className="text-neutral-500 dark:text-neutral-400 block">Waktu Dibuat</span>
            <span className="font-mono text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              {formatDate(barang.created_at)}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
            <span className="text-neutral-500 dark:text-neutral-400 block">Terakhir Diperbarui</span>
            <span className="font-mono text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              {formatDate(barang.updated_at)}
            </span>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Hapus Barang?"
        description={`Apakah Anda yakin ingin menghapus "${barang.nama}"?`}
        variant="danger"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
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
        <div className="p-2.5 rounded-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
          <p className="font-semibold text-neutral-900 dark:text-white">
            {barang.nama}
          </p>
          <p className="text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
            {barang.kode} · {barang.kategori} · {barang.jumlah} unit
          </p>
        </div>
      </Dialog>
    </div>
  );
}
