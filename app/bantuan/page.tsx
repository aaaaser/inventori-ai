'use client';

import React from 'react';
import { HelpCircle, Terminal, Database, Shield, BookOpen, Layers } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function BantuanPage() {
  const faqs = [
    {
      q: 'Bagaimana cara menambahkan barang baru?',
      a: 'Pilih menu "Tambah" pada navigasi bawah atau tombol "+ Tambah Barang" di halaman Home/Barang. Masukkan kode unik, nama, kategori, jumlah unit (≥ 0), dan kondisi barang, lalu klik Simpan.',
    },
    {
      q: 'Apakah kode barang boleh sama / duplikat?',
      a: 'Tidak boleh. Sistem secara otomatis memeriksa keunikan kode barang (misalnya ELK-001) baik di database Neon PostgreSQL maupun fallback memory.',
    },
    {
      q: 'Bagaimana cara menghubungkan Neon PostgreSQL?',
      a: 'Buka menu Pengaturan, pastikan environment variable DATABASE_URL sudah diisi dengan Connection String dari Neon Console. Drizzle ORM akan otomatis menggunakan koneksi database aktif.',
    },
    {
      q: 'Bagaimana sistem navigasi More bekerja?',
      a: 'Navigasi dirancang data-driven. 4 menu utama selalu berada di bar bawah, sementara menu tambahan seperti Kategori, Users, Aktivitas, Notifikasi, dan Bantuan dapat diakses instan melalui tombol More.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
            PUSAT BANTUAN
          </h1>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Panduan penggunaan, dokumentasi sistem inventaris, dan tanya jawab umum.
        </p>
      </header>

      {/* Quick Docs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Card className="p-3.5">
          <div className="flex items-center gap-2.5 text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            <Database className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span>Database Neon & Drizzle ORM</span>
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Menyimpan data barang inventaris secara reliabel dengan skema PostgreSQL serverless.
          </p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center gap-2.5 text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            <Layers className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span>Navigasi Dinamis & Scalable</span>
          </div>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Mendukung ekspansi puluhan menu tanpa mengganggu tampilan compact di mobile maupun desktop.
          </p>
        </Card>
      </div>

      {/* FAQ Accordion / Cards */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
          Pertanyaan Sering Diajukan (FAQ)
        </h2>

        {faqs.map((faq, idx) => (
          <Card key={idx} className="p-3.5 space-y-1.5">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-start gap-2">
              <span className="font-mono text-neutral-400">Q{idx + 1}:</span>
              {faq.q}
            </h3>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 pl-6 leading-relaxed">
              {faq.a}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
