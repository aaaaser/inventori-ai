'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { BarangFormData } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BarangForm } from '@/components/barang/BarangForm';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';

export default function TambahBarangPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const canAdd = user?.role === 'SUPER_ADMIN' || user?.role === 'LABORAN';

  const handleSubmit = async (formData: BarangFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/barang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        showToast('Barang berhasil ditambahkan!', 'success');
        router.push('/barang');
      } else {
        showToast(data.message || 'Gagal menambahkan barang', 'error');
        if (data.errors) {
          throw { errors: data.errors };
        }
      }
    } catch (err: any) {
      if (err?.errors) throw err;
      showToast('Terjadi masalah saat menghubungi server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canAdd) {
    return (
      <div className="space-y-4">
        <header className="pb-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
          <Link href="/barang">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Kembali ke Data Barang
            </Button>
          </Link>
        </header>

        <Card className="p-6 text-center space-y-3 max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            Akses Dibatasi
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Menu dan formulir Tambah Barang hanya berlaku untuk pengguna dengan hak akses <strong>Super Admin</strong> dan <strong>Laboran</strong>.
          </p>
          <div className="pt-2">
            <Link href="/dashboard">
              <Button variant="primary" size="sm">
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </Card>
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
            Tambah Barang
          </h1>
        </div>
      </header>

      {/* Form Container */}
      <Card className="p-4 sm:p-5">
        <div className="mb-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Lengkapi formulir di bawah ini untuk mendaftarkan barang baru ke dalam sistem inventaris.
          </p>
        </div>

        <BarangForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/barang')}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}
