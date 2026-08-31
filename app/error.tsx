'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="py-16 text-center space-y-4">
      <div className="w-12 h-12 rounded-sm bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 mx-auto flex items-center justify-center text-red-600 dark:text-red-400">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white">
          Tidak Dapat Memuat Halaman
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
          Terjadi masalah teknis pada aplikasi. Data Anda aman. Silakan klik tombol di bawah untuk mencoba kembali.
        </p>
      </div>
      <div className="pt-2">
        <Button
          onClick={() => reset()}
          variant="primary"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Coba Lagi
        </Button>
      </div>
    </div>
  );
}
