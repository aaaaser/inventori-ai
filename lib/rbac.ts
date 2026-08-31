export type UserRole =
  | 'SUPER_ADMIN'
  | 'KEPALA_SEKOLAH'
  | 'OPERATOR'
  | 'WAKA_SARPRAS'
  | 'KAKOM'
  | 'LABORAN';

export type JurusanKode = 'RPL' | 'ATPH' | 'TBSM';

export const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'KEPALA_SEKOLAH',
  'OPERATOR',
  'WAKA_SARPRAS',
  'KAKOM',
  'LABORAN',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  KEPALA_SEKOLAH: 'Kepala Sekolah',
  OPERATOR: 'Operator Sistem',
  WAKA_SARPRAS: 'Waka Sarpras',
  KAKOM: 'Kepala Kompetensi Keahlian (Kakom)',
  LABORAN: 'Laboran / Pengelola Lab',
};

export type BorrowingStatus =
  | 'DRAFT'
  | 'MENUNGGU_PERSETUJUAN_KAKOM'
  | 'DITOLAK_KAKOM'
  | 'MENUNGGU_PERSETUJUAN_SARPRAS'
  | 'DITOLAK_SARPRAS'
  | 'MENUNGGU_PERSETUJUAN_KEPALA_SEKOLAH'
  | 'MENUNGGU_PERSETUJUAN_KEPSEK'
  | 'DITOLAK_KEPALA_SEKOLAH'
  | 'DITOLAK'
  | 'DISETUJUI'
  | 'DIPINJAM'
  | 'DIKEMBALIKAN'
  | 'DIBATALKAN';

export const BORROWING_STATUS_LABELS: Record<BorrowingStatus, string> = {
  DRAFT: 'Draft',
  MENUNGGU_PERSETUJUAN_KAKOM: 'Menunggu Review Kakom',
  DITOLAK_KAKOM: 'Ditolak Kakom',
  MENUNGGU_PERSETUJUAN_SARPRAS: 'Menunggu Otorisasi Sarpras',
  DITOLAK_SARPRAS: 'Ditolak Sarpras',
  MENUNGGU_PERSETUJUAN_KEPALA_SEKOLAH: 'Menunggu Persetujuan Kepsek',
  MENUNGGU_PERSETUJUAN_KEPSEK: 'Menunggu Persetujuan Kepsek',
  DITOLAK_KEPALA_SEKOLAH: 'Ditolak Kepsek',
  DITOLAK: 'Ditolak',
  DISETUJUI: 'Disetujui (Siap Diambil)',
  DIPINJAM: 'Sedang Dipinjam',
  DIKEMBALIKAN: 'Sudah Dikembalikan',
  DIBATALKAN: 'Dibatalkan',
};

export type Permission =
  | 'dashboard.view'
  | 'asset.view'
  | 'asset.create'
  | 'asset.update'
  | 'asset.delete'
  | 'asset.history.view'
  | 'borrowing.view'
  | 'borrowing.create'
  | 'borrowing.update'
  | 'borrowing.delete'
  | 'borrowing.submit'
  | 'borrowing.handover'
  | 'borrowing.return'
  | 'approval.kakom'
  | 'approval.sarpras'
  | 'approval.kepala_sekolah'
  | 'approval.override'
  | 'user.view'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'master.view'
  | 'master.create'
  | 'master.update'
  | 'master.delete'
  | 'report.view'
  | 'report.export'
  | 'audit.view';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'dashboard.view',
    'asset.view',
    'asset.create',
    'asset.update',
    'asset.delete',
    'asset.history.view',
    'borrowing.view',
    'borrowing.create',
    'borrowing.update',
    'borrowing.delete',
    'borrowing.submit',
    'borrowing.handover',
    'borrowing.return',
    'approval.kakom',
    'approval.sarpras',
    'approval.kepala_sekolah',
    'approval.override',
    'user.view',
    'user.create',
    'user.update',
    'user.delete',
    'master.view',
    'master.create',
    'master.update',
    'master.delete',
    'report.view',
    'report.export',
    'audit.view',
  ],
  OPERATOR: [
    'dashboard.view',
    'asset.view',
    'asset.history.view',
    'borrowing.view',
    'borrowing.handover',
    'borrowing.return',
    'user.view',
    'user.create',
    'user.update',
    'user.delete',
    'master.view',
    'master.create',
    'master.update',
    'master.delete',
    'report.view',
    'report.export',
    'audit.view',
  ],
  KEPALA_SEKOLAH: [
    'dashboard.view',
    'asset.view',
    'asset.history.view',
    'borrowing.view',
    'approval.kepala_sekolah',
    'report.view',
    'report.export',
  ],
  WAKA_SARPRAS: [
    'dashboard.view',
    'asset.view',
    'asset.history.view',
    'borrowing.view',
    'approval.sarpras',
    'report.view',
    'report.export',
  ],
  KAKOM: [
    'dashboard.view',
    'asset.view',
    'asset.history.view',
    'borrowing.view',
    'approval.kakom',
    'report.view',
  ],
  LABORAN: [
    'dashboard.view',
    'asset.view',
    'asset.create',
    'asset.update',
    'asset.delete',
    'asset.history.view',
    'borrowing.view',
    'borrowing.create',
    'borrowing.update',
    'borrowing.delete',
    'borrowing.submit',
    'borrowing.handover',
    'borrowing.return',
    'report.view',
  ],
};

export function hasPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
