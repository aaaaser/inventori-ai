import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="py-20 text-center space-y-4">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold font-mono text-neutral-900 dark:text-white">404</h1>
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
      </div>

      <div className="pt-2">
        <Link href="/">
          <Button variant="primary" size="sm" leftIcon={<Home className="w-3.5 h-3.5" />}>
            Kembali ke Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
