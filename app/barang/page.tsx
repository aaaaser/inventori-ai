'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Package } from 'lucide-react';
import { Barang } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { BarangCard } from '@/components/barang/BarangCard';
import { BarangSearch } from '@/components/barang/BarangSearch';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';

export default function BarangPage() {
  const [items, setItems] = useState<Barang[]>([]);
  const [kategoriList, setKategoriList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('all');
  const [kondisi, setKondisi] = useState('all');
  const [sort, setSort] = useState('terbaru');

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Barang | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (kategori && kategori !== 'all') params.set('kategori', kategori);
      if (kondisi && kondisi !== 'all') params.set('kondisi', kondisi);
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/barang?${params.toString()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);

        // Derive unique categories from full list if not set
        const categories = Array.from(new Set(json.data.map((i: Barang) => i.kategori))) as string[];
        if (categories.length > 0) {
          setKategoriList((prev) => Array.from(new Set([...prev, ...categories])));
        }
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error('Error fetching barang:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search, kategori, kondisi, sort]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/barang/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Barang "${deleteTarget.nama}" berhasil dihapus`, 'success');
        setDeleteTarget(null);
        fetchItems();
      } else {
        showToast(data.message || 'Gagal menghapus barang', 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="pb-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Daftar Barang
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Kelola, cari, dan perbarui data stok inventaris.
          </p>
        </div>

        <Link href="/barang/tambah">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Tambah Barang
          </Button>
        </Link>
      </header>

      {/* Search & Filters */}
      <BarangSearch
        search={search}
        onSearchChange={setSearch}
        kategori={kategori}
        onKategoriChange={setKategori}
        kondisi={kondisi}
        onKondisiChange={setKondisi}
        sort={sort}
        onSortChange={setSort}
        kategoriList={kategoriList}
        totalResults={items.length}
      />

      {/* Error state */}
      {isError && (
        <div className="p-4 border border-red-200 dark:border-red-900/60 rounded-sm bg-red-50/50 dark:bg-red-950/20 text-center space-y-2">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            Gagal mengambil data barang dari server.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchItems}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !isError && (
        <Loading message="Memuat daftar barang..." className="py-12" />
      )}

      {/* Items List */}
      {!isLoading && !isError && (
        <>
          {items.length === 0 ? (
            <EmptyState
              title={search || kategori !== 'all' || kondisi !== 'all' ? 'Barang tidak ditemukan' : 'Belum ada data barang'}
              description={
                search || kategori !== 'all' || kondisi !== 'all'
                  ? 'Coba ganti kata kunci pencarian atau ubah filter.'
                  : 'Tambahkan barang baru ke inventaris Anda sekarang.'
              }
              actionLabel={
                search || kategori !== 'all' || kondisi !== 'all' ? 'Reset Pencarian' : '+ Tambah Barang'
              }
              onAction={
                search || kategori !== 'all' || kondisi !== 'all'
                  ? () => {
                      setSearch('');
                      setKategori('all');
                      setKondisi('all');
                    }
                  : () => (window.location.href = '/barang/tambah')
              }
            />
          ) : (
            <div className="space-y-2.5">
              {items.map((barang) => (
                <BarangCard
                  key={barang.id}
                  barang={barang}
                  onDelete={(target) => setDeleteTarget(target)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Barang?"
        description="Apakah Anda yakin ingin menghapus data barang ini?"
        variant="danger"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
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
        {deleteTarget && (
          <div className="p-2.5 rounded-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs space-y-1">
            <p className="font-semibold text-neutral-900 dark:text-white">
              {deleteTarget.nama}
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 font-mono">
              {deleteTarget.kode} · {deleteTarget.kategori} · {deleteTarget.jumlah} unit
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}
