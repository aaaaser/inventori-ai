import {
  Home,
  Package,
  Plus,
  FileText,
  Folder,
  Users,
  Bell,
  Settings,
  ClipboardList,
  History,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
  badge?: string | number;
  description?: string;
}

/**
 * Konfigurasi Menu Navigasi Data-Driven
 * - 4 Menu Utama di Bottom Navigation Bar
 * - Menu Tambahan di dalam Bottom Sheet (› More)
 */
export const navigationItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/dashboard',
    icon: Home,
    primary: true,
    description: 'Ringkasan inventaris & statistik',
  },
  {
    id: 'barang',
    label: 'Barang',
    href: '/barang',
    icon: Package,
    primary: true,
    description: 'Katalog & manajemen data barang',
  },
  {
    id: 'peminjaman',
    label: 'Peminjaman',
    href: '/peminjaman',
    icon: ClipboardList,
    primary: true,
    description: 'Alur pengajuan & persetujuan peminjaman',
  },
  {
    id: 'laporan',
    label: 'Laporan',
    href: '/laporan',
    icon: FileText,
    primary: true,
    description: 'Rekapitulasi aset & ekspor data',
  },
  {
    id: 'tambah',
    label: 'Tambah',
    href: '/barang/tambah',
    icon: Plus,
    primary: false,
    description: 'Input barang baru ke sistem',
  },
  {
    id: 'kategori',
    label: 'Kategori',
    href: '/kategori',
    icon: Folder,
    primary: false,
    description: 'Pengelompokan barang inventaris',
  },
  {
    id: 'users',
    label: 'Users',
    href: '/users',
    icon: Users,
    primary: false,
    description: 'Manajemen pengguna & hak akses (RBAC)',
  },
  {
    id: 'aktivitas',
    label: 'Audit Log',
    href: '/aktivitas',
    icon: History,
    primary: false,
    description: 'Riwayat mutasi & log aktivitas sistem',
  },
  {
    id: 'notifikasi',
    label: 'Notifikasi',
    href: '/notifikasi',
    icon: Bell,
    primary: false,
    badge: 3,
    description: 'Peringatan stok menipis & persetujuan',
  },
  {
    id: 'pengaturan',
    label: 'Pengaturan',
    href: '/pengaturan',
    icon: Settings,
    primary: false,
    description: 'Koneksi database & preferensi',
  },
];

export function getPartitionedNavigation(items: NavItem[] = navigationItems) {
  if (items.length <= 4) {
    return {
      primaryItems: items,
      moreItems: [],
      hasMore: false,
    };
  }

  const explicitlyPrimary = items.filter((item) => item.primary);

  let primaryItems: NavItem[] = [];
  let moreItems: NavItem[] = [];

  if (explicitlyPrimary.length > 0 && explicitlyPrimary.length <= 4) {
    primaryItems = explicitlyPrimary;
    const primaryIds = new Set(primaryItems.map((i) => i.id));
    moreItems = items.filter((item) => !primaryIds.has(item.id));
  } else {
    primaryItems = items.slice(0, 4);
    moreItems = items.slice(4);
  }

  return {
    primaryItems,
    moreItems,
    hasMore: moreItems.length > 0,
  };
}

export function isRouteActive(currentPath: string, href: string): boolean {
  if (href === '/dashboard' || href === '/') {
    return currentPath === '/dashboard' || (href === '/' && currentPath === '/');
  }
  if (href === '/barang') {
    return (
      currentPath === '/barang' ||
      (currentPath.startsWith('/barang/') && currentPath !== '/barang/tambah')
    );
  }
  if (href === '/barang/tambah') {
    return currentPath === '/barang/tambah';
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
}
