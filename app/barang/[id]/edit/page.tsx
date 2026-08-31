'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Barang, BarangFormData } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BarangForm } from '@/components/barang/BarangForm';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';

export default function EditBarangPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [barang, setBarang] = useState<Barang | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setIsFetching(true);
        setIsError(false);

        const res = await fetch(`/api/barang/${params.id}`);
        const data = await res.json();

        if (data.success && data.data) {
          setBarang(data.data);
        } else {
          setIsError(true);
        }
      } catch (err) {
        console.error('Error fetching item for edit:', err);
        setIsError(true);
      } finally {
        setIsFetching(false);
      }
    };

    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const handleSubmit = async (formData: BarangFormData) => {
    if (!barang) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/barang/${barang.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        showToast('Data barang berhasil diperbarui!', 'success');
        router.push(`/barang/${barang.id}`);
      } else {
        showToast(data.message || 'Gagal memperbarui barang', 'error');
        if (data.errors) {
          throw { errors: data.errors };
        }
      }
    } catch (err: any) {
      if (err?.errors) throw err;
      showToast('Terjadi kesalahan koneksi server', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return <Loading message="Mengambil data barang..." className="py-16" />;
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
          Barang yang akan diedit tidak tersedia.
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
          <Link href={`/barang/${barang.id}`}>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Batal
            </Button>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Edit Barang
          </h1>
        </div>
      </header>

      {/* Form Container */}
      <Card className="p-4 sm:p-5">
        <div className="mb-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Ubah rincian barang <strong className="text-neutral-900 dark:text-white">{barang.nama}</strong> ({barang.kode}).
          </p>
        </div>

        <BarangForm
          initialData={barang}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/barang/${barang.id}`)}
          isLoading={isSaving}
        />
      </Card>
    </div>
  );
}
