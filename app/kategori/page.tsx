'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Folder, ChevronRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { KATEGORI_OPTIONS } from '@/lib/utils';
import { Barang } from '@/lib/types';

export default function KategoriPage() {
  const [items, setItems] = useState<Barang[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/barang');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const categoryCounts = items.reduce((acc, item) => {
    acc[item.kategori] = (acc[item.kategori] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              KATEGORI BARANG
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Daftar kelompok inventaris untuk memudahkan klasifikasi aset.
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

      {isLoading ? (
        <Loading message="Memuat daftar kategori..." />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {KATEGORI_OPTIONS.map((kat) => {
              const count = categoryCounts[kat] || 0;
              return (
                <Link
                  key={kat}
                  href={`/barang?kategori=${encodeURIComponent(kat)}`}
                  className="group block"
                >
                  <Card className="hover:border-neutral-400 dark:hover:border-neutral-600 transition-all p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-white">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:underline">
                          {kat}
                        </h3>
                        <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          {count} item terdaftar
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 group-hover:translate-x-0.5 transition-transform" />
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
