export function formatDate(dateString?: string | Date): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function formatRelativeTime(dateString?: string | Date): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Baru saja';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} menit lalu`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} jam lalu`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} hari lalu`;
    }
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} bulan lalu`;
  } catch {
    return formatDate(dateString);
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function getKondisiBadgeStyle(kondisi: string): { bg: string; text: string; border: string } {
  switch (kondisi) {
    case 'Baru':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/60',
      };
    case 'Baik':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/60',
      };
    case 'Rusak Ringan':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/60',
      };
    case 'Rusak Berat':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/60',
      };
    default:
      return {
        bg: 'bg-neutral-100 dark:bg-neutral-800',
        text: 'text-neutral-700 dark:text-neutral-300',
        border: 'border-neutral-200 dark:border-neutral-700',
      };
  }
}

export const KATEGORI_OPTIONS = [
  'Elektronik',
  'Peralatan Kantor',
  'Furniture',
  'Komputer & IT',
  'Kendaraan & Transportasi',
  'Perkakas & Alat',
  'Buku & Referensi',
  'Lainnya',
];

export const KONDISI_OPTIONS = [
  'Baru',
  'Baik',
  'Rusak Ringan',
  'Rusak Berat',
];
