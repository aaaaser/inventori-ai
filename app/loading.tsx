'use client';

import { Loading } from '@/components/ui/Loading';

export default function LoadingPage() {
  return (
    <div className="py-16 flex items-center justify-center">
      <Loading message="Memuat halaman..." />
    </div>
  );
}
