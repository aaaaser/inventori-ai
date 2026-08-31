import { UserRole, JurusanKode, Permission } from './rbac';

export type KondisiBarang = 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Baru' | 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT';
export type AssetStatus = 'TERSEDIA' | 'DIPINJAM' | 'PERBAIKAN' | 'RUSAK' | 'TIDAK_AKTIF';

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

export interface UserSession {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  jurusan_id?: number | null;
  jurusan_kode?: JurusanKode | null;
  is_active: boolean;
  status?: string;
  created_at?: string;
  last_login?: string;
}

export interface JurusanData {
  id: number;
  kode: JurusanKode;
  nama: string;
}

export interface CategoryData {
  id: number;
  name: string;
  description?: string | null;
}

export interface RoomData {
  id: number;
  name: string;
  jurusan_id?: number | null;
  jurusan_kode?: string | null;
}

export interface AssetGroupData {
  id: number;
  kode_kelompok: string;
  nama_barang: string;
  jurusan_id: number;
  jurusan_kode?: string;
  kategori_id?: number | null;
  kategori_nama?: string;
  merk?: string | null;
  tipe?: string | null;
  satuan?: string;
  total_units?: number;
  available_units?: number;
  created_at: string;
  updated_at: string;
}

export interface AssetData {
  id: number;
  asset_group_id: number;
  kode_barang: string;
  kode_unit?: string;
  nomor_unit: number;
  nama_barang?: string;
  kategori?: string;
  jurusan_kode?: string;
  jurusan_nama?: string;
  merk?: string | null;
  tipe?: string | null;
  nomor_seri?: string | null;
  ruangan_id?: number | null;
  ruangan_nama?: string | null;
  kondisi: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' | string;
  status: AssetStatus;
  tahun_perolehan?: number | null;
  sumber_dana?: string | null;
  harga_perolehan?: number | null;
  foto?: string | null;
  keterangan?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface BorrowingItemData {
  id: number;
  borrowing_id: number;
  asset_id: number;
  kode_barang: string;
  kode_unit?: string;
  nama_barang: string;
  kondisi_sebelum: string;
  kondisi_sesudah?: string | null;
  catatan?: string | null;
}

export interface ApprovalData {
  id: number;
  borrowing_id: number;
  user_id: number;
  user_name: string;
  role: UserRole;
  status: 'APPROVED' | 'REJECTED' | 'OVERRIDDEN';
  catatan?: string | null;
  approved_at: string;
}

export interface BorrowingData {
  id: number;
  nomor_pengajuan: string;
  nomor_peminjaman?: string;
  user_id: number;
  user_name: string;
  peminjam_nama?: string;
  jurusan_id: number;
  jurusan_kode: string;
  jurusan_nama?: string;
  tanggal_pengajuan: string;
  tanggal_peminjaman: string;
  tanggal_pengembalian_rencana: string;
  tanggal_pengembalian_realisasi?: string | null;
  tujuan: string;
  keperluan: string;
  status: BorrowingStatus;
  catatan?: string | null;
  items: BorrowingItemData[];
  approvals: ApprovalData[];
  created_at: string;
  updated_at: string;
}

export interface AssetHistoryData {
  id: number;
  asset_id: number;
  kode_barang?: string;
  nama_barang?: string;
  user_id?: number | null;
  user_name?: string | null;
  action: string;
  old_value?: string | null;
  new_value?: string | null;
  description?: string | null;
  created_at: string;
}

export interface AuditLogData {
  id: number;
  user_id?: number | null;
  user_name?: string | null;
  user_role?: string | null;
  action: string;
  entity_table?: string;
  entity_id?: number | string;
  target?: string | null;
  target_id?: string | null;
  description?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export type AuditLogRecord = AuditLogData;
export type BorrowingRecord = BorrowingData;
export type SchoolAsset = AssetData;


// Legacy Barang interface for backward compatibility with existing views
export interface Barang {
  id: number;
  kode: string;
  nama: string;
  kategori: string;
  jumlah: number;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Baru' | string;
  status?: string;
  jurusan?: string;
  ruangan?: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface BarangFormData {
  kode?: string;
  nama: string;
  kategori: string;
  jumlah: number;
  kondisi: string;
  jurusan?: string;
  ruangan?: string;
  merk?: string;
  tipe?: string;
  nomor_seri?: string;
  tahun_perolehan?: number;
  sumber_dana?: string;
  harga_perolehan?: number;
  keterangan?: string;
}

export interface StatsData {
  totalBarang: number;
  totalUnits?: number;
  totalAset?: number;
  barangBaik: number;
  barangRusak: number;
  barangBaru: number;
  tersedia?: number;
  dipinjam?: number;
  perbaikan?: number;
  totalPengajuan?: number;
  menungguPersetujuan?: number;
  pengajuanDisetujui?: number;
  pengajuanDitolak?: number;
  totalKategori: number;
  totalNilaiAset?: number;
  stokKritis: Array<{
    id: number;
    kode: string;
    nama: string;
    kategori: string;
    jumlah: number;
  }>;
  kategoriCount: Record<string, number>;
  kondisiCount: {
    Baik: number;
    RusakRingan: number;
    RusakBerat: number;
    Baru: number;
  };
  jurusanCount?: Record<string, number>;
}

export interface AppNotification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string | Date;
}
