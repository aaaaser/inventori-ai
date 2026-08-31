import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/lib/auth-context';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';

export const metadata: Metadata = {
  title: 'Sistem Inventori dan Peminjaman Aset Sekolah',
  description: 'Aplikasi manajemen inventaris aset per jurusan (RPL, ATPH, TBSM) dan sistem peminjaman dengan persetujuan bertingkat.',
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 antialiased flex flex-col font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
        <AuthProvider>
          <ToastProvider>
            {/* Top Header with Profile and Notifications */}
            <TopHeader />

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 pb-28">
              {children}
            </main>

            {/* Floating Bottom Navigation */}
            <BottomNavigation />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
