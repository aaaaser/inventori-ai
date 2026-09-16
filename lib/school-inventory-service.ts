import bcrypt from 'bcryptjs';
import { db, isDbConnected } from '@/db';
import {
  jurusan as jurusanTable,
  rooms as roomsTable,
  users as usersTable,
  assetGroups as assetGroupsTable,
  assets as assetsTable,
  borrowings as borrowingsTable,
  borrowingItems as borrowingItemsTable,
  approvals as approvalsTable,
  assetMaintenances as assetMaintenancesTable,
  assetHistories as assetHistoriesTable,
  auditLogs as auditLogsTable,
  notifications as notificationsTable,
  barang as barangLegacyTable,
} from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import {
  UserSession,
  JurusanData,
  RoomData,
  AssetGroupData,
  AssetData,
  BorrowingData,
  BorrowingItemData,
  ApprovalData,
  AssetMaintenanceData,
  AssetHistoryData,
  AuditLogData,
  StatsData,
  AppNotification,
  Barang,
} from './types';
import { UserRole, hasPermission } from './rbac';
import { getDataScope, canAccessJurusan, getEffectiveJurusanFilter } from './data-scope';

// Hash of default development passwords created with bcrypt salt 10
// Precalculated hashes for fast startup
const DEFAULT_SALT = 10;

export interface SeedUserDef {
  name: string;
  username: string;
  email: string;
  rawPassword: string;
  role: UserRole;
  jurusanKode?: 'RPL' | 'ATPH' | 'TBSM';
}

export const SEED_USERS: SeedUserDef[] = [
  {
    name: 'Super Admin',
    username: 'superadmin',
    email: 'superadmin@local.test',
    rawPassword: 'SuperAdmin123!',
    role: 'SUPER_ADMIN',
  },
  {
    name: 'Operator',
    username: 'operator',
    email: 'operator@local.test',
    rawPassword: 'Operator123!',
    role: 'OPERATOR',
  },
  {
    name: 'Kepala Sekolah',
    username: 'kepsek',
    email: 'kepsek@local.test',
    rawPassword: 'Kepsek123!',
    role: 'KEPALA_SEKOLAH',
  },
  {
    name: 'Waka Sarpras',
    username: 'sarpras',
    email: 'sarpras@local.test',
    rawPassword: 'Sarpras123!',
    role: 'WAKA_SARPRAS',
  },
  {
    name: 'Kakom RPL',
    username: 'kakom.rpl',
    email: 'kakom.rpl@local.test',
    rawPassword: 'KakomRPL123!',
    role: 'KAKOM',
    jurusanKode: 'RPL',
  },
  {
    name: 'Kakom ATPH',
    username: 'kakom.atph',
    email: 'kakom.atph@local.test',
    rawPassword: 'KakomATPH123!',
    role: 'KAKOM',
    jurusanKode: 'ATPH',
  },
  {
    name: 'Kakom TBSM',
    username: 'kakom.tbsm',
    email: 'kakom.tbsm@local.test',
    rawPassword: 'KakomTBSM123!',
    role: 'KAKOM',
    jurusanKode: 'TBSM',
  },
  {
    name: 'Laboran RPL',
    username: 'laboran.rpl',
    email: 'laboran.rpl@local.test',
    rawPassword: 'LaboranRPL123!',
    role: 'LABORAN',
    jurusanKode: 'RPL',
  },
  {
    name: 'Laboran ATPH',
    username: 'laboran.atph',
    email: 'laboran.atph@local.test',
    rawPassword: 'LaboranATPH123!',
    role: 'LABORAN',
    jurusanKode: 'ATPH',
  },
  {
    name: 'Laboran TBSM',
    username: 'laboran.tbsm',
    email: 'laboran.tbsm@local.test',
    rawPassword: 'LaboranTBSM123!',
    role: 'LABORAN',
    jurusanKode: 'TBSM',
  },
];

// IN-MEMORY STORAGE STATE
let memoryInitialized = false;

interface InMemoryStore {
  jurusan: JurusanData[];
  rooms: RoomData[];
  users: Array<{
    id: number;
    name: string;
    username: string;
    email: string;
    password_hash: string;
    role: UserRole;
    jurusan_id?: number | null;
    is_active: boolean;
    last_login?: string;
    created_at: string;
    updated_at: string;
  }>;
  assetGroups: AssetGroupData[];
  assets: AssetData[];
  assetMaintenances: AssetMaintenanceData[];
  borrowings: BorrowingData[];
  assetHistories: AssetHistoryData[];
  auditLogs: AuditLogData[];
  notifications: AppNotification[];
}

const memoryStore: InMemoryStore = {
  jurusan: [
    { id: 1, kode: 'RPL', nama: 'Rekayasa Perangkat Lunak' },
    { id: 2, kode: 'ATPH', nama: 'Agribisnis Tanaman Pangan dan Hortikultura' },
    { id: 3, kode: 'TBSM', nama: 'Teknik dan Bisnis Sepeda Motor' },
  ],
  rooms: [
    { id: 1, name: 'Lab Komputer RPL 1', nama_ruangan: 'Lab Komputer RPL 1', kode_ruangan: 'LAB-RPL-01', jurusan_id: 1, jurusan_kode: 'RPL', lokasi: 'Gedung RPL Lt. 2', is_active: true, keterangan: 'Laboratorium Pemrograman & Jaringan', created_at: new Date('2026-01-01T08:00:00Z').toISOString(), updated_at: new Date('2026-01-01T08:00:00Z').toISOString() },
    { id: 2, name: 'Lab Software & RPL 2', nama_ruangan: 'Lab Software & RPL 2', kode_ruangan: 'LAB-RPL-02', jurusan_id: 1, jurusan_kode: 'RPL', lokasi: 'Gedung RPL Lt. 2', is_active: true, keterangan: 'Laboratorium Rekayasa Perangkat Lunak', created_at: new Date('2026-01-01T08:00:00Z').toISOString(), updated_at: new Date('2026-01-01T08:00:00Z').toISOString() },
    { id: 3, name: 'Greenhouse ATPH', nama_ruangan: 'Greenhouse ATPH', kode_ruangan: 'GH-ATPH-01', jurusan_id: 2, jurusan_kode: 'ATPH', lokasi: 'Area Kebun Praktik', is_active: true, keterangan: 'Rumah Kaca Pembibitan & Hidroponik', created_at: new Date('2026-01-01T08:00:00Z').toISOString(), updated_at: new Date('2026-01-01T08:00:00Z').toISOString() },
    { id: 4, name: 'Lahan Praktik Pertanian', nama_ruangan: 'Lahan Praktik Pertanian', kode_ruangan: 'LHN-ATPH-01', jurusan_id: 2, jurusan_kode: 'ATPH', lokasi: 'Lahan Terbuka Belakang', is_active: true, keterangan: 'Lahan Tanaman Pangan & Hortikultura', created_at: new Date('2026-01-01T08:00:00Z').toISOString(), updated_at: new Date('2026-01-01T08:00:00Z').toISOString() },
    { id: 5, name: 'Bengkel TBSM 1 (Mesin)', nama_ruangan: 'Bengkel TBSM 1 (Mesin)', kode_ruangan: 'BKL-TBSM-01', jurusan_id: 3, jurusan_kode: 'TBSM', lokasi: 'Gedung Bengkel Otomotif Lt. 1', is_active: true, keterangan: 'Area Praktik Mesin & Tune-up', created_at: new Date('2026-01-01T08:00:00Z').toISOString(), updated_at: new Date('2026-01-01T08:00:00Z').toISOString() },
    { id: 6, name: 'Bengkel TBSM 2 (Chasis)', nama_ruangan: 'Bengkel TBSM 2 (Chasis)', kode_ruangan: 'BKL-TBSM-02', jurusan_id: 3, jurusan_kode: 'TBSM', lokasi: 'Gedung Bengkel Otomotif Lt. 1', is_active: true, keterangan: 'Area Praktik Chasis & Kelistrikan', created_at: new Date('2026-01-01T08:00:00Z').toISOString(), updated_at: new Date('2026-01-01T08:00:00Z').toISOString() },
    { id: 7, name: 'Gudang Utama Sarpras', nama_ruangan: 'Gudang Utama Sarpras', kode_ruangan: 'GDG-SARPRAS-01', jurusan_id: null, jurusan_kode: 'UMUM', lokasi: 'Gedung Pusat Administrasi Lt. 1', is_active: true, keterangan: 'Penyimpanan Aset Pusat Sekolah', created_at: new Date('2026-01-01T08:00:00Z').toISOString(), updated_at: new Date('2026-01-01T08:00:00Z').toISOString() },
  ],
  users: [],
  assetGroups: [],
  assets: [],
  assetMaintenances: [],
  borrowings: [],
  assetHistories: [],
  auditLogs: [],
  notifications: [],
};

// Initialize In-Memory Seed Data
export async function initializeMemoryStore() {
  if (memoryInitialized) return;

  // Initialize Users
  for (let i = 0; i < SEED_USERS.length; i++) {
    const u = SEED_USERS[i];
    const jurusanId = u.jurusanKode
      ? memoryStore.jurusan.find((j) => j.kode === u.jurusanKode)?.id || null
      : null;

    const hash = bcrypt.hashSync(u.rawPassword, DEFAULT_SALT);
    memoryStore.users.push({
      id: i + 1,
      name: u.name,
      username: u.username,
      email: u.email,
      password_hash: hash,
      role: u.role,
      jurusan_id: jurusanId,
      is_active: true,
      created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Initialize Asset Groups & Physical Unit Assets
  // 1. RPL Komputer
  const ag1: AssetGroupData = {
    id: 1,
    kode_kelompok: 'BRG-RPL-001',
    nama_barang: 'Komputer PC Core i7 Lab RPL',
    jurusan_id: 1,
    jurusan_kode: 'RPL',
    merk: 'Dell OptiPlex',
    tipe: '7090 Tower',
    satuan: 'Unit',
    total_units: 5,
    available_units: 5,
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.assetGroups.push(ag1);

  for (let u = 1; u <= 5; u++) {
    const unitPad = String(u).padStart(3, '0');
    memoryStore.assets.push({
      id: memoryStore.assets.length + 1,
      asset_group_id: 1,
      kode_barang: `BRG-RPL-001-${unitPad}`,
      nomor_unit: u,
      nama_barang: 'Komputer PC Core i7 Lab RPL',
      jurusan_kode: 'RPL',
      jurusan_nama: 'Rekayasa Perangkat Lunak',
      merk: 'Dell OptiPlex',
      tipe: '7090 Tower',
      nomor_seri: `SN-DELL-RPL-${unitPad}`,
      ruangan_id: 1,
      ruangan_nama: 'Lab Komputer RPL 1',
      kondisi: 'BAIK',
      status: 'TERSEDIA',
      tahun_perolehan: 2025,
      sumber_dana: 'Dana BOS Kinerja',
      harga_perolehan: 14500000,
      keterangan: `PC Praktik Siswa Unit ${u}`,
      created_by: 8, // laboran.rpl
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 2. RPL Laptop ThinkPad
  const ag2: AssetGroupData = {
    id: 2,
    kode_kelompok: 'BRG-RPL-002',
    nama_barang: 'Laptop Lenovo ThinkPad E14',
    jurusan_id: 1,
    jurusan_kode: 'RPL',
    merk: 'Lenovo',
    tipe: 'ThinkPad E14 Gen 4',
    satuan: 'Unit',
    total_units: 3,
    available_units: 2,
    created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.assetGroups.push(ag2);

  for (let u = 1; u <= 3; u++) {
    const unitPad = String(u).padStart(3, '0');
    memoryStore.assets.push({
      id: memoryStore.assets.length + 1,
      asset_group_id: 2,
      kode_barang: `BRG-RPL-002-${unitPad}`,
      nomor_unit: u,
      nama_barang: 'Laptop Lenovo ThinkPad E14',
      jurusan_kode: 'RPL',
      jurusan_nama: 'Rekayasa Perangkat Lunak',
      merk: 'Lenovo',
      tipe: 'ThinkPad E14 Gen 4',
      nomor_seri: `SN-LN-TP-${unitPad}`,
      ruangan_id: 2,
      ruangan_nama: 'Lab Software & RPL 2',
      kondisi: u === 3 ? 'RUSAK_RINGAN' : 'BAIK',
      status: u === 3 ? 'PERBAIKAN' : 'TERSEDIA',
      tahun_perolehan: 2025,
      sumber_dana: 'DAK Fisik SMK',
      harga_perolehan: 11200000,
      keterangan: u === 3 ? 'Keyboard tombol enter longgar' : 'Laptop Pembelajaran Mobile',
      created_by: 8,
      created_at: new Date('2026-01-12T08:00:00Z').toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 3. ATPH Hand Traktor
  const ag3: AssetGroupData = {
    id: 3,
    kode_kelompok: 'BRG-ATPH-001',
    nama_barang: 'Hand Traktor Pengolah Tanah Quick G1000',
    jurusan_id: 2,
    jurusan_kode: 'ATPH',
    merk: 'Quick',
    tipe: 'G1000 Boxer Kubota RD 85',
    satuan: 'Unit',
    total_units: 3,
    available_units: 3,
    created_at: new Date('2026-01-15T08:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.assetGroups.push(ag3);

  for (let u = 1; u <= 3; u++) {
    const unitPad = String(u).padStart(3, '0');
    memoryStore.assets.push({
      id: memoryStore.assets.length + 1,
      asset_group_id: 3,
      kode_barang: `BRG-ATPH-001-${unitPad}`,
      nomor_unit: u,
      nama_barang: 'Hand Traktor Pengolah Tanah Quick G1000',
      jurusan_kode: 'ATPH',
      jurusan_nama: 'Agribisnis Tanaman Pangan dan Hortikultura',
      merk: 'Quick',
      tipe: 'G1000 Boxer',
      nomor_seri: `SN-QK-TR-${unitPad}`,
      ruangan_id: 4,
      ruangan_nama: 'Lahan Praktik Pertanian',
      kondisi: 'BAIK',
      status: 'TERSEDIA',
      tahun_perolehan: 2024,
      sumber_dana: 'Komite Sekolah',
      harga_perolehan: 28500000,
      keterangan: 'Traktor roda dua untuk pengolahan lahan sawah/praktik',
      created_by: 9, // laboran.atph
      created_at: new Date('2026-01-15T08:00:00Z').toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 4. TBSM Sepeda Motor Praktik
  const ag4: AssetGroupData = {
    id: 4,
    kode_kelompok: 'BRG-TBSM-001',
    nama_barang: 'Sepeda Motor Praktik Honda Beat 110cc',
    jurusan_id: 3,
    jurusan_kode: 'TBSM',
    merk: 'Honda',
    tipe: 'Beat eSP PGM-FI',
    satuan: 'Unit',
    total_units: 3,
    available_units: 3,
    created_at: new Date('2026-01-18T08:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.assetGroups.push(ag4);

  for (let u = 1; u <= 3; u++) {
    const unitPad = String(u).padStart(3, '0');
    memoryStore.assets.push({
      id: memoryStore.assets.length + 1,
      asset_group_id: 4,
      kode_barang: `BRG-TBSM-001-${unitPad}`,
      nomor_unit: u,
      nama_barang: 'Sepeda Motor Praktik Honda Beat 110cc',
      jurusan_kode: 'TBSM',
      jurusan_nama: 'Teknik dan Bisnis Sepeda Motor',
      merk: 'Honda',
      tipe: 'Beat eSP PGM-FI',
      nomor_seri: `MH1JM311${unitPad}`,
      ruangan_id: 5,
      ruangan_nama: 'Bengkel TBSM 1 (Mesin)',
      kondisi: 'BAIK',
      status: 'TERSEDIA',
      tahun_perolehan: 2024,
      sumber_dana: 'BOS Reguler',
      harga_perolehan: 18200000,
      keterangan: `Unit Trainer Sepeda Motor Praktik #${u}`,
      created_by: 10, // laboran.tbsm
      created_at: new Date('2026-01-18T08:00:00Z').toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 5. TBSM Tool Set Mekanik
  const ag5: AssetGroupData = {
    id: 5,
    kode_kelompok: 'BRG-TBSM-002',
    nama_barang: 'Tool Set Mekanik Lengkap 120 Pcs',
    jurusan_id: 3,
    jurusan_kode: 'TBSM',
    merk: 'Tekiro',
    tipe: '120 Pcs Mechanic Box Set',
    satuan: 'Set',
    total_units: 2,
    available_units: 2,
    created_at: new Date('2026-01-20T08:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.assetGroups.push(ag5);

  for (let u = 1; u <= 2; u++) {
    const unitPad = String(u).padStart(3, '0');
    memoryStore.assets.push({
      id: memoryStore.assets.length + 1,
      asset_group_id: 5,
      kode_barang: `BRG-TBSM-002-${unitPad}`,
      nomor_unit: u,
      nama_barang: 'Tool Set Mekanik Lengkap 120 Pcs',
      jurusan_kode: 'TBSM',
      jurusan_nama: 'Teknik dan Bisnis Sepeda Motor',
      merk: 'Tekiro',
      tipe: '120 Pcs Mechanic Box Set',
      nomor_seri: `TK-BOX-120-${unitPad}`,
      ruangan_id: 5,
      ruangan_nama: 'Bengkel TBSM 1 (Mesin)',
      kondisi: 'BAIK',
      status: 'TERSEDIA',
      tahun_perolehan: 2025,
      sumber_dana: 'BOS Kinerja',
      harga_perolehan: 4750000,
      keterangan: `Box Perkakas Mekanik Meja Kerja ${u}`,
      created_by: 10,
      created_at: new Date('2026-01-20T08:00:00Z').toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Seed sample borrowing workflow
  const sampleBorrowing: BorrowingData = {
    id: 1,
    nomor_pengajuan: 'REQ-20260830-0001',
    user_id: 8, // Laboran RPL
    user_name: 'Laboran RPL',
    jurusan_id: 1,
    jurusan_kode: 'RPL',
    jurusan_nama: 'Rekayasa Perangkat Lunak',
    tanggal_pengajuan: new Date('2026-08-30T09:00:00Z').toISOString(),
    tanggal_peminjaman: '2026-09-01',
    tanggal_pengembalian_rencana: '2026-09-03',
    tujuan: 'Pelatihan Sertifikasi Kompetensi Siswa RPL',
    keperluan: 'Peminjaman 2 unit Laptop ThinkPad untuk instruktur workshop LSP P1',
    status: 'MENUNGGU_PERSETUJUAN_KAKOM',
    catatan: 'Dibutuhkan selama 3 hari berturut-turut di Aula Utama',
    items: [
      {
        id: 1,
        borrowing_id: 1,
        asset_id: 6, // BRG-RPL-002-001
        kode_barang: 'BRG-RPL-002-001',
        nama_barang: 'Laptop Lenovo ThinkPad E14',
        kondisi_sebelum: 'BAIK',
      },
      {
        id: 2,
        borrowing_id: 1,
        asset_id: 7, // BRG-RPL-002-002
        kode_barang: 'BRG-RPL-002-002',
        nama_barang: 'Laptop Lenovo ThinkPad E14',
        kondisi_sebelum: 'BAIK',
      },
    ],
    approvals: [],
    created_at: new Date('2026-08-30T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryStore.borrowings.push(sampleBorrowing);

  // Initial Asset Maintenances (Riwayat Perawatan)
  memoryStore.assetMaintenances.push(
    {
      id: 1,
      asset_id: 1, // BRG-RPL-001-001
      kode_barang: 'BRG-RPL-001-001',
      nama_barang: 'Komputer PC Core i7 Lab RPL',
      tanggal_perawatan: '2026-08-15',
      jenis_perawatan: 'Pembersihan & Ganti Thermal Paste',
      deskripsi: 'Pembersihan debu motherboard, heatsink fan, dan penggantian thermal paste CPU.',
      pelaksana: 'Laboran RPL',
      biaya: 0,
      kondisi_sebelum: 'BAIK',
      kondisi_sesudah: 'BAIK',
      status: 'SELESAI',
      catatan: 'Temperatur kerja normal stabil pada 42°C.',
      created_by: 8,
      created_by_name: 'Laboran RPL',
      created_at: new Date('2026-08-15T09:00:00Z').toISOString(),
      updated_at: new Date('2026-08-15T11:30:00Z').toISOString(),
    },
    {
      id: 2,
      asset_id: 8, // BRG-RPL-002-003
      kode_barang: 'BRG-RPL-002-003',
      nama_barang: 'Laptop Lenovo ThinkPad E14',
      tanggal_perawatan: '2026-09-02',
      jenis_perawatan: 'Perbaikan Keyboard',
      deskripsi: 'Pemeriksaan tombol enter macet dan pembersihan switch keyboard.',
      pelaksana: 'Laboran RPL',
      biaya: 50000,
      kondisi_sebelum: 'RUSAK_RINGAN',
      kondisi_sesudah: 'RUSAK_RINGAN',
      status: 'PROSES',
      catatan: 'Menunggu penggantian modul switch keyboard cadangan.',
      created_by: 8,
      created_by_name: 'Laboran RPL',
      created_at: new Date('2026-09-02T10:00:00Z').toISOString(),
      updated_at: new Date('2026-09-02T10:00:00Z').toISOString(),
    },
    {
      id: 3,
      asset_id: 9, // BRG-ATPH-001-001
      kode_barang: 'BRG-ATPH-001-001',
      nama_barang: 'Hand Traktor Quick G 1000 Boxer',
      tanggal_perawatan: '2026-08-20',
      jenis_perawatan: 'Servis Berkala & Ganti Oli Mesin',
      deskripsi: 'Penggantian oli mesin diesel Kubota RD 85, penyetelan v-belt penggerak, dan pelumasan rantai gardan.',
      pelaksana: 'Teknisi Bengkel Pertanian',
      biaya: 175000,
      kondisi_sebelum: 'BAIK',
      kondisi_sesudah: 'BAIK',
      status: 'SELESAI',
      catatan: 'Mesin siap operasional untuk praktikum pengolahan lahan.',
      created_by: 9,
      created_by_name: 'Laboran ATPH',
      created_at: new Date('2026-08-20T08:30:00Z').toISOString(),
      updated_at: new Date('2026-08-20T12:00:00Z').toISOString(),
    },
    {
      id: 4,
      asset_id: 12, // BRG-TBSM-001-001
      kode_barang: 'BRG-TBSM-001-001',
      nama_barang: 'Sepeda Motor Honda Beat FI ESP Praktik',
      tanggal_perawatan: '2026-08-25',
      jenis_perawatan: 'Tune Up & Kalibrasi Injeksi',
      deskripsi: 'Pembersihan throttle body simulator, penggantian busi NGK, dan reset nilai ECM.',
      pelaksana: 'Laboran TBSM',
      biaya: 85000,
      kondisi_sebelum: 'BAIK',
      kondisi_sesudah: 'BAIK',
      status: 'SELESAI',
      catatan: 'Kalibrasi TPS dan AFR telah sesuai standar servis pabrikan.',
      created_by: 10,
      created_by_name: 'Laboran TBSM',
      created_at: new Date('2026-08-25T09:00:00Z').toISOString(),
      updated_at: new Date('2026-08-25T11:00:00Z').toISOString(),
    }
  );

  // Initial Notifications
  memoryStore.notifications.push(
    {
      id: 1,
      user_id: 'all',
      title: 'Sistem Inventaris Siap Digunakan',
      message: 'Database aset sekolah 3 jurusan (RPL, ATPH, TBSM) telah terkonfigurasi dengan role-based access control.',
      is_read: false,
      created_at: new Date('2026-08-31T07:00:00Z'),
    },
    {
      id: 2,
      user_id: '5', // Kakom RPL
      title: 'Pengajuan Peminjaman Baru',
      message: 'Laboran RPL mengajukan peminjaman Laptop ThinkPad (REQ-20260830-0001). Menunggu persetujuan Anda.',
      is_read: false,
      created_at: new Date('2026-08-30T09:05:00Z'),
    }
  );

  // Initial Audit Log
  memoryStore.auditLogs.push({
    id: 1,
    user_id: 1,
    user_name: 'Super Admin',
    user_role: 'SUPER_ADMIN',
    action: 'SYSTEM_INITIALIZATION',
    target: 'SYSTEM',
    target_id: '1',
    description: 'Sistem Inventori dan Peminjaman Aset Sekolah berhasil diinisialisasi dengan master jurusan, kategori, dan user.',
    ip_address: '127.0.0.1',
    created_at: new Date('2026-08-31T07:00:00Z').toISOString(),
  });

  memoryInitialized = true;
}

// ----------------------------------------------------
// AUTHENTICATION & USER MANAGEMENT
// ----------------------------------------------------

export async function authenticateUser(
  identifier: string, // username or email
  passwordPlain: string
): Promise<{ success: boolean; user?: UserSession; message?: string }> {
  await initializeMemoryStore();
  const trimmed = identifier.trim().toLowerCase();

  // Try DB first if connected
  if (isDbConnected && db) {
    try {
      const dbUsers = await db
        .select()
        .from(usersTable)
        .where(
          sql`LOWER(${usersTable.username}) = ${trimmed} OR LOWER(${usersTable.email}) = ${trimmed}`
        )
        .limit(1);

      if (dbUsers.length > 0) {
        const u = dbUsers[0];
        if (!u.is_active) {
          return { success: false, message: 'Akun Anda dinonaktifkan. Hubungi Administrator.' };
        }

        const match = bcrypt.compareSync(passwordPlain, u.password_hash);
        if (!match) {
          return { success: false, message: 'Username/Email atau Password salah.' };
        }

        // update last login
        await db
          .update(usersTable)
          .set({ last_login: new Date() })
          .where(eq(usersTable.id, u.id));

        const jur = u.jurusan_id
          ? (await db.select().from(jurusanTable).where(eq(jurusanTable.id, u.jurusan_id)))[0]
          : null;

        const sessionUser: UserSession = {
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          role: u.role as UserRole,
          jurusan_id: u.jurusan_id,
          jurusan_kode: jur ? (jur.kode as any) : null,
          is_active: u.is_active,
          status: u.is_active ? 'Aktif' : 'Nonaktif',
          created_at: u.created_at.toISOString(),
          last_login: new Date().toISOString(),
        };

        await logAudit({
          user_id: u.id,
          user_name: u.name,
          user_role: u.role,
          action: 'LOGIN',
          target: 'AUTH',
          target_id: String(u.id),
          description: `User ${u.name} (${u.role}) berhasil login ke sistem.`,
        });

        return { success: true, user: sessionUser };
      }
    } catch (e) {
      console.warn('DB query error on auth, falling back to memory store:', e);
    }
  }

  // Fallback to In-Memory
  const u = memoryStore.users.find(
    (item) =>
      item.username.toLowerCase() === trimmed || item.email.toLowerCase() === trimmed
  );

  if (!u) {
    return { success: false, message: 'Username atau password tidak ditemukan.' };
  }

  if (!u.is_active) {
    return { success: false, message: 'Akun ini dinonaktifkan oleh administrator.' };
  }

  const match = bcrypt.compareSync(passwordPlain, u.password_hash);
  if (!match) {
    return { success: false, message: 'Password salah.' };
  }

  u.last_login = new Date().toISOString();
  const jur = u.jurusan_id
    ? memoryStore.jurusan.find((j) => j.id === u.jurusan_id)
    : null;

  const sessionUser: UserSession = {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    jurusan_id: u.jurusan_id,
    jurusan_kode: jur ? (jur.kode as any) : null,
    is_active: u.is_active,
    status: u.is_active ? 'Aktif' : 'Nonaktif',
    created_at: u.created_at,
    last_login: u.last_login,
  };

  await logAudit({
    user_id: u.id,
    user_name: u.name,
    user_role: u.role,
    action: 'LOGIN',
    target: 'AUTH',
    target_id: String(u.id),
    description: `User ${u.name} (${u.role}) berhasil login ke sistem.`,
  });

  return { success: true, user: sessionUser };
}

export async function getUserById(id: number): Promise<UserSession | null> {
  await initializeMemoryStore();

  if (isDbConnected && db) {
    try {
      const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      if (rows.length > 0) {
        const u = rows[0];
        const jur = u.jurusan_id
          ? (await db.select().from(jurusanTable).where(eq(jurusanTable.id, u.jurusan_id)))[0]
          : null;
        return {
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          role: u.role as UserRole,
          jurusan_id: u.jurusan_id,
          jurusan_kode: jur ? (jur.kode as any) : null,
          is_active: u.is_active,
          status: u.is_active ? 'Aktif' : 'Nonaktif',
          created_at: u.created_at.toISOString(),
          last_login: u.last_login ? u.last_login.toISOString() : undefined,
        };
      }
    } catch (e) {
      console.warn('DB error in getUserById:', e);
    }
  }

  const u = memoryStore.users.find((item) => item.id === id);
  if (!u) return null;
  const jur = u.jurusan_id
    ? memoryStore.jurusan.find((j) => j.id === u.jurusan_id)
    : null;

  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    jurusan_id: u.jurusan_id,
    jurusan_kode: jur ? (jur.kode as any) : null,
    is_active: u.is_active,
    status: u.is_active ? 'Aktif' : 'Nonaktif',
    created_at: u.created_at,
    last_login: u.last_login,
  };
}

export async function getAllUsers(): Promise<UserSession[]> {
  await initializeMemoryStore();
  if (isDbConnected && db) {
    try {
      const rows = await db.select().from(usersTable).orderBy(desc(usersTable.id));
      const jurs = await db.select().from(jurusanTable);
      return rows.map((u) => {
        const jur = jurs.find((j) => j.id === u.jurusan_id);
        return {
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          role: u.role as UserRole,
          jurusan_id: u.jurusan_id,
          jurusan_kode: jur ? (jur.kode as any) : null,
          is_active: u.is_active,
          status: u.is_active ? 'Aktif' : 'Nonaktif',
          created_at: u.created_at.toISOString(),
          last_login: u.last_login ? u.last_login.toISOString() : undefined,
        };
      });
    } catch (e) {
      console.warn('DB error in getAllUsers:', e);
    }
  }

  return memoryStore.users.map((u) => {
    const jur = u.jurusan_id
      ? memoryStore.jurusan.find((j) => j.id === u.jurusan_id)
      : null;
    return {
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role,
      jurusan_id: u.jurusan_id,
      jurusan_kode: jur ? (jur.kode as any) : null,
      is_active: u.is_active,
      status: u.is_active ? 'Aktif' : 'Nonaktif',
      created_at: u.created_at,
      last_login: u.last_login,
    };
  });
}

export async function createUser(
  data: {
    name: string;
    username: string;
    email: string;
    passwordPlain: string;
    role: UserRole;
    jurusan_id?: number | null;
  },
  actor?: UserSession
): Promise<{ success: boolean; user?: UserSession; message?: string }> {
  await initializeMemoryStore();

  if (actor && !hasPermission(actor.role, 'user.create')) {
    return { success: false, message: 'Anda tidak memiliki hak akses untuk menambah user.' };
  }

  const trimmedUsername = data.username.trim().toLowerCase();
  const trimmedEmail = data.email.trim().toLowerCase();

  // Validate duplicate
  const exists = memoryStore.users.find(
    (u) => u.username.toLowerCase() === trimmedUsername || u.email.toLowerCase() === trimmedEmail
  );
  if (exists) {
    return { success: false, message: 'Username atau Email sudah terdaftar dalam sistem.' };
  }

  const hash = bcrypt.hashSync(data.passwordPlain, DEFAULT_SALT);
  const newId = memoryStore.users.length + 1;
  const now = new Date().toISOString();

  const newUserRecord = {
    id: newId,
    name: data.name.trim(),
    username: trimmedUsername,
    email: trimmedEmail,
    password_hash: hash,
    role: data.role,
    jurusan_id: data.jurusan_id || null,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  memoryStore.users.push(newUserRecord);

  if (isDbConnected && db) {
    try {
      await db.insert(usersTable).values({
        name: data.name.trim(),
        username: trimmedUsername,
        email: trimmedEmail,
        password_hash: hash,
        role: data.role,
        jurusan_id: data.jurusan_id || null,
        is_active: true,
      });
    } catch (e) {
      console.warn('DB insert error in createUser:', e);
    }
  }

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'USER_CREATED',
    target: 'USER',
    target_id: String(newId),
    description: `User baru dibuat: ${data.name} (${data.role}) oleh ${actor?.name || 'Sistem'}.`,
  });

  const sessionUser = await getUserById(newId);
  return { success: true, user: sessionUser || undefined };
}

export async function toggleUserStatus(
  userId: number,
  actor?: UserSession
): Promise<{ success: boolean; is_active?: boolean; message?: string }> {
  await initializeMemoryStore();
  if (actor && !hasPermission(actor.role, 'user.update')) {
    return { success: false, message: 'Anda tidak memiliki hak akses untuk mengubah status user.' };
  }

  const u = memoryStore.users.find((item) => item.id === userId);
  if (!u) return { success: false, message: 'User tidak ditemukan.' };

  if (u.role === 'SUPER_ADMIN' && u.id === actor?.id) {
    return { success: false, message: 'Tidak dapat menonaktifkan akun Super Admin sendiri.' };
  }

  u.is_active = !u.is_active;
  u.updated_at = new Date().toISOString();

  if (isDbConnected && db) {
    try {
      await db
        .update(usersTable)
        .set({ is_active: u.is_active, updated_at: new Date() })
        .where(eq(usersTable.id, userId));
    } catch (e) {
      console.warn('DB update error in toggleUserStatus:', e);
    }
  }

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'USER_STATUS_TOGGLED',
    target: 'USER',
    target_id: String(userId),
    description: `Status user ${u.name} diubah menjadi ${u.is_active ? 'AKTIF' : 'NONAKTIF'} oleh ${actor?.name || 'Sistem'}.`,
  });

  return { success: true, is_active: u.is_active };
}

export async function resetUserPassword(
  userId: number,
  newPasswordPlain: string,
  actor?: UserSession
): Promise<{ success: boolean; message?: string }> {
  await initializeMemoryStore();
  if (actor && !hasPermission(actor.role, 'user.update') && actor.role !== 'SUPER_ADMIN') {
    return { success: false, message: 'Hanya Super Admin/Operator yang dapat mereset password.' };
  }

  const u = memoryStore.users.find((item) => item.id === userId);
  if (!u) return { success: false, message: 'User tidak ditemukan.' };

  const hash = bcrypt.hashSync(newPasswordPlain, DEFAULT_SALT);
  u.password_hash = hash;
  u.updated_at = new Date().toISOString();

  if (isDbConnected && db) {
    try {
      await db
        .update(usersTable)
        .set({ password_hash: hash, updated_at: new Date() })
        .where(eq(usersTable.id, userId));
    } catch (e) {
      console.warn('DB reset password error:', e);
    }
  }

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'USER_PASSWORD_RESET',
    target: 'USER',
    target_id: String(userId),
    description: `Password untuk user ${u.name} direset oleh ${actor?.name || 'Sistem'}.`,
  });

  return { success: true, message: 'Password berhasil direset.' };
}

// ----------------------------------------------------
// MASTER DATA (JURUSAN, CATEGORIES, ROOMS)
// ----------------------------------------------------

export async function getMasterJurusan(): Promise<JurusanData[]> {
  await initializeMemoryStore();
  if (isDbConnected && db) {
    try {
      const rows = await db.select().from(jurusanTable).orderBy(jurusanTable.id);
      if (rows.length > 0) return rows as JurusanData[];
    } catch (e) {
      console.warn('DB getMasterJurusan error:', e);
    }
  }
  return memoryStore.jurusan;
}

export async function getMasterCategories(): Promise<{ id: number; name: string; description?: string | null }[]> {
  await initializeMemoryStore();
  return [];
}

export async function getMasterRooms(
  jurusanId?: number | null,
  actor?: UserSession | null,
  activeOnly = false
): Promise<RoomData[]> {
  await initializeMemoryStore();

  let roomList = [...memoryStore.rooms];

  // RBAC and Jurusan Scope filter
  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanId) {
    roomList = roomList.filter((r) => !r.jurusan_id || r.jurusan_id === scope.jurusanId);
  } else if (jurusanId) {
    roomList = roomList.filter((r) => !r.jurusan_id || r.jurusan_id === jurusanId);
  }

  if (activeOnly) {
    roomList = roomList.filter((r) => r.is_active !== false);
  }

  // Populate jurusan_kode and nama_ruangan
  return roomList.map((r) => {
    const jur = r.jurusan_id ? memoryStore.jurusan.find((j) => j.id === r.jurusan_id) : null;
    return {
      ...r,
      nama_ruangan: r.nama_ruangan || r.name,
      jurusan_kode: jur ? jur.kode : r.jurusan_kode || 'UMUM',
    };
  });
}

export async function getRoomById(
  id: number,
  actor?: UserSession | null
): Promise<RoomData | null> {
  await initializeMemoryStore();
  const room = memoryStore.rooms.find((r) => r.id === id);
  if (!room) return null;

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanId && room.jurusan_id && room.jurusan_id !== scope.jurusanId) {
    return null;
  }

  const jur = room.jurusan_id ? memoryStore.jurusan.find((j) => j.id === room.jurusan_id) : null;
  return {
    ...room,
    nama_ruangan: room.nama_ruangan || room.name,
    jurusan_kode: jur ? jur.kode : room.jurusan_kode || 'UMUM',
  };
}

export async function createRoom(
  data: {
    name: string;
    kode_ruangan?: string;
    jurusan_id?: number | null;
    lokasi?: string;
    keterangan?: string;
  },
  actor?: UserSession
): Promise<{ success: boolean; room?: RoomData; message?: string }> {
  await initializeMemoryStore();

  if (actor && !hasPermission(actor.role, 'asset.create') && actor.role !== 'SUPER_ADMIN' && actor.role !== 'OPERATOR' && actor.role !== 'LABORAN') {
    return { success: false, message: 'Anda tidak memiliki hak akses untuk menambah data ruangan.' };
  }

  const scope = getDataScope(actor);
  let targetJurusanId = data.jurusan_id ?? null;

  // Auto-assign / Enforce Jurusan for Laboran / Kakom
  if (scope.isScoped && scope.jurusanId) {
    targetJurusanId = scope.jurusanId;
  }

  const jur = targetJurusanId ? memoryStore.jurusan.find((j) => j.id === targetJurusanId) : null;
  const now = new Date().toISOString();
  const newId = memoryStore.rooms.length > 0 ? Math.max(...memoryStore.rooms.map((r) => r.id)) + 1 : 1;

  const newRoom: RoomData = {
    id: newId,
    name: data.name.trim(),
    nama_ruangan: data.name.trim(),
    kode_ruangan: data.kode_ruangan?.trim() || `R-${jur ? jur.kode : 'UMUM'}-${String(newId).padStart(2, '0')}`,
    jurusan_id: targetJurusanId,
    jurusan_kode: jur ? jur.kode : 'UMUM',
    lokasi: data.lokasi?.trim() || null,
    is_active: true,
    keterangan: data.keterangan?.trim() || null,
    created_at: now,
    updated_at: now,
  };

  memoryStore.rooms.push(newRoom);

  if (isDbConnected && db) {
    try {
      await db.insert(roomsTable).values({
        name: newRoom.name,
        kode_ruangan: newRoom.kode_ruangan,
        jurusan_id: newRoom.jurusan_id,
        lokasi: newRoom.lokasi,
        is_active: true,
        keterangan: newRoom.keterangan,
      });
    } catch (e) {
      console.warn('DB insert error in createRoom:', e);
    }
  }

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'ROOM_CREATED',
    target: 'ROOM',
    target_id: String(newId),
    description: `Ruangan baru "${newRoom.name}" (${newRoom.kode_ruangan}) ditambahkan oleh ${actor?.name || 'Sistem'}.`,
  });

  return { success: true, room: newRoom, message: `Ruangan "${newRoom.name}" berhasil dibuat.` };
}

export async function updateRoom(
  id: number,
  data: Partial<RoomData>,
  actor?: UserSession
): Promise<{ success: boolean; room?: RoomData; message?: string }> {
  await initializeMemoryStore();

  const room = memoryStore.rooms.find((r) => r.id === id);
  if (!room) return { success: false, message: 'Ruangan tidak ditemukan.' };

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanId && room.jurusan_id && room.jurusan_id !== scope.jurusanId) {
    return { success: false, message: `Anda hanya dapat mengubah data ruangan di jurusan Anda sendiri (${scope.jurusanKode}).` };
  }

  const now = new Date().toISOString();
  if (data.name) {
    room.name = data.name.trim();
    room.nama_ruangan = data.name.trim();
  }
  if (data.kode_ruangan !== undefined) room.kode_ruangan = data.kode_ruangan?.trim() || null;
  if (data.lokasi !== undefined) room.lokasi = data.lokasi?.trim() || null;
  if (data.keterangan !== undefined) room.keterangan = data.keterangan?.trim() || null;
  if (data.is_active !== undefined) room.is_active = data.is_active;

  if (!scope.isScoped && data.jurusan_id !== undefined) {
    room.jurusan_id = data.jurusan_id;
    const jur = data.jurusan_id ? memoryStore.jurusan.find((j) => j.id === data.jurusan_id) : null;
    room.jurusan_kode = jur ? jur.kode : 'UMUM';
  }

  room.updated_at = now;

  // Also update room names in active assets located in this room
  for (const asset of memoryStore.assets) {
    if (asset.ruangan_id === id) {
      asset.ruangan_nama = room.name;
    }
  }

  if (isDbConnected && db) {
    try {
      await db
        .update(roomsTable)
        .set({
          name: room.name,
          kode_ruangan: room.kode_ruangan,
          jurusan_id: room.jurusan_id,
          lokasi: room.lokasi,
          is_active: room.is_active,
          keterangan: room.keterangan,
          updated_at: new Date(),
        })
        .where(eq(roomsTable.id, id));
    } catch (e) {
      console.warn('DB update error in updateRoom:', e);
    }
  }

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'ROOM_UPDATED',
    target: 'ROOM',
    target_id: String(id),
    description: `Ruangan "${room.name}" (${room.kode_ruangan}) diperbarui oleh ${actor?.name || 'Sistem'}.`,
  });

  return { success: true, room, message: `Data ruangan "${room.name}" berhasil diperbarui.` };
}

export async function toggleRoomStatus(
  id: number,
  actor?: UserSession
): Promise<{ success: boolean; is_active?: boolean; message?: string }> {
  await initializeMemoryStore();

  const room = memoryStore.rooms.find((r) => r.id === id);
  if (!room) return { success: false, message: 'Ruangan tidak ditemukan.' };

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanId && room.jurusan_id && room.jurusan_id !== scope.jurusanId) {
    return { success: false, message: `Anda hanya dapat mengubah status ruangan di jurusan Anda sendiri (${scope.jurusanKode}).` };
  }

  room.is_active = !room.is_active;
  room.updated_at = new Date().toISOString();

  if (isDbConnected && db) {
    try {
      await db
        .update(roomsTable)
        .set({ is_active: room.is_active, updated_at: new Date() })
        .where(eq(roomsTable.id, id));
    } catch (e) {
      console.warn('DB update error in toggleRoomStatus:', e);
    }
  }

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'ROOM_STATUS_TOGGLED',
    target: 'ROOM',
    target_id: String(id),
    description: `Status ruangan "${room.name}" diubah menjadi ${room.is_active ? 'AKTIF' : 'NONAKTIF'} oleh ${actor?.name || 'Sistem'}.`,
  });

  return { success: true, is_active: room.is_active, message: `Ruangan sekarang ${room.is_active ? 'Aktif' : 'Nonaktif'}.` };
}

export async function deleteRoom(
  id: number,
  actor?: UserSession
): Promise<{ success: boolean; message?: string }> {
  await initializeMemoryStore();

  const idx = memoryStore.rooms.findIndex((r) => r.id === id);
  if (idx === -1) return { success: false, message: 'Ruangan tidak ditemukan.' };

  const room = memoryStore.rooms[idx];
  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanId && room.jurusan_id && room.jurusan_id !== scope.jurusanId) {
    return { success: false, message: `Anda hanya dapat menghapus ruangan di jurusan Anda sendiri (${scope.jurusanKode}).` };
  }

  // Check if any assets currently belong to this room
  const assetsInRoom = memoryStore.assets.filter((a) => a.ruangan_id === id);
  if (assetsInRoom.length > 0) {
    return {
      success: false,
      message: `Tidak dapat menghapus ruangan "${room.name}" karena masih menampung ${assetsInRoom.length} unit aset. Pindahkan aset terlebih dahulu.`,
    };
  }

  memoryStore.rooms.splice(idx, 1);

  if (isDbConnected && db) {
    try {
      await db.delete(roomsTable).where(eq(roomsTable.id, id));
    } catch (e) {
      console.warn('DB delete error in deleteRoom:', e);
    }
  }

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'ROOM_DELETED',
    target: 'ROOM',
    target_id: String(id),
    description: `Ruangan "${room.name}" (${room.kode_ruangan}) dihapus oleh ${actor?.name || 'Sistem'}.`,
  });

  return { success: true, message: `Ruangan "${room.name}" berhasil dihapus.` };
}

// ----------------------------------------------------
// ASSET CODE GENERATOR (HIERARCHICAL CODE)
// ----------------------------------------------------

export async function generateNextAssetGroupCode(jurusanKode: string): Promise<string> {
  await initializeMemoryStore();
  const jCode = jurusanKode.toUpperCase();
  const prefix = `BRG-${jCode}-`;

  // Find highest group sequence in this jurusan
  const existingCodes = memoryStore.assetGroups
    .filter((ag) => ag.kode_kelompok.startsWith(prefix))
    .map((ag) => {
      const numPart = ag.kode_kelompok.replace(prefix, '');
      return parseInt(numPart, 10) || 0;
    });

  const nextNum = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

export async function generateNextUnitCodes(
  groupCode: string,
  quantity: number
): Promise<{ startingUnitNumber: number; unitCodes: string[] }> {
  await initializeMemoryStore();

  const activeUnitNums = memoryStore.assets
    .filter((a) => a.kode_barang.startsWith(`${groupCode}-`))
    .map((a) => a.nomor_unit || parseInt(a.kode_barang.split('-').pop() || '0', 10));

  const historyUnitNums = memoryStore.assetHistories
    .filter((h) => h.kode_barang && h.kode_barang.startsWith(`${groupCode}-`))
    .map((h) => parseInt(h.kode_barang!.split('-').pop() || '0', 10));

  const auditUnitNums = memoryStore.auditLogs
    .filter((l) => l.target_id && l.target_id.startsWith(`${groupCode}-`))
    .map((l) => parseInt(l.target_id!.split('-').pop() || '0', 10));

  const allNums = [...activeUnitNums, ...historyUnitNums, ...auditUnitNums].filter(
    (n) => !isNaN(n) && n > 0
  );

  const highestUnit = allNums.length > 0 ? Math.max(...allNums) : 0;
  const unitCodes: string[] = [];

  for (let i = 1; i <= quantity; i++) {
    const unitNumber = highestUnit + i;
    unitCodes.push(`${groupCode}-${String(unitNumber).padStart(3, '0')}`);
  }

  return {
    startingUnitNumber: highestUnit + 1,
    unitCodes,
  };
}

// ----------------------------------------------------
// ASSET GROUPS / JENIS BARANG MANAGEMENT
// ----------------------------------------------------

export async function getAssetGroups(
  filters?: {
    jurusanId?: number;
    jurusanKode?: string;
    search?: string;
  },
  actor?: UserSession | null
): Promise<AssetGroupData[]> {
  await initializeMemoryStore();

  let groups = [...memoryStore.assetGroups];

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode) {
    groups = groups.filter((g) => g.jurusan_kode === scope.jurusanKode);
  } else {
    if (filters?.jurusanId) {
      groups = groups.filter((g) => g.jurusan_id === filters.jurusanId);
    }
    if (filters?.jurusanKode && filters.jurusanKode !== 'SEMUA') {
      groups = groups.filter((g) => g.jurusan_kode === filters.jurusanKode);
    }
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    groups = groups.filter(
      (g) =>
        g.kode_kelompok.toLowerCase().includes(q) ||
        g.nama_barang.toLowerCase().includes(q) ||
        (g.merk && g.merk.toLowerCase().includes(q)) ||
        (g.tipe && g.tipe.toLowerCase().includes(q))
    );
  }

  // Dynamically compute total and available units from actual unit assets
  for (const g of groups) {
    const units = memoryStore.assets.filter((a) => a.asset_group_id === g.id);
    g.total_units = units.length;
    g.available_units = units.filter((a) => a.status === 'TERSEDIA').length;
  }

  groups.sort((a, b) => b.id - a.id);
  return groups;
}

export async function getAssetGroupById(
  id: number,
  actor?: UserSession | null
): Promise<AssetGroupData | null> {
  await initializeMemoryStore();
  const group = memoryStore.assetGroups.find((g) => g.id === id);
  if (!group) return null;

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && group.jurusan_kode !== scope.jurusanKode) {
    return null;
  }

  const units = memoryStore.assets.filter((a) => a.asset_group_id === group.id);
  group.total_units = units.length;
  group.available_units = units.filter((a) => a.status === 'TERSEDIA').length;

  return group;
}

export async function createAssetGroup(
  data: {
    nama_barang: string;
    jurusan_id: number;
    kategori_id?: number | null;
    kategori_nama?: string | null;
    merk?: string | null;
    tipe?: string | null;
    satuan?: string;
  },
  actor?: UserSession
): Promise<{ success: boolean; group?: AssetGroupData; message?: string }> {
  await initializeMemoryStore();

  if (actor && !hasPermission(actor.role, 'asset.create')) {
    return { success: false, message: 'Role Anda tidak memiliki izin untuk membuat jenis barang.' };
  }

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanId) {
    data.jurusan_id = scope.jurusanId;
  }

  const jur = memoryStore.jurusan.find((j) => j.id === data.jurusan_id);
  if (!jur) return { success: false, message: 'Jurusan tidak valid.' };

  if (scope.isScoped && scope.jurusanKode && jur.kode !== scope.jurusanKode) {
    return { success: false, message: `Anda hanya dapat membuat jenis barang pada jurusan Anda sendiri (${scope.jurusanKode}).` };
  }

  const groupCode = await generateNextAssetGroupCode(jur.kode);
  const now = new Date().toISOString();

  const newGroup: AssetGroupData = {
    id: memoryStore.assetGroups.length + 1,
    kode_kelompok: groupCode,
    nama_barang: data.nama_barang.trim(),
    jurusan_id: jur.id,
    jurusan_kode: jur.kode,
    merk: data.merk || null,
    tipe: data.tipe || null,
    satuan: data.satuan || 'Unit',
    total_units: 0,
    available_units: 0,
    created_at: now,
    updated_at: now,
  };

  memoryStore.assetGroups.push(newGroup);

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'ASSET_GROUP_CREATED',
    target: 'ASSET_GROUP',
    target_id: groupCode,
    description: `Jenis barang baru dibuat: ${groupCode} (${newGroup.nama_barang}) untuk jurusan ${jur.kode} oleh ${actor?.name || 'Sistem'}.`,
  });

  return {
    success: true,
    group: newGroup,
    message: `Jenis barang ${groupCode} (${newGroup.nama_barang}) berhasil dibuat.`,
  };
}

export async function createUnitsForAssetGroup(
  data: {
    asset_group_id: number;
    jumlah: number;
    kondisi: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' | string;
    ruangan_id?: number | null;
    ruangan_nama?: string | null;
    tahun_perolehan?: number | null;
    sumber_dana?: string | null;
    harga_perolehan?: number | null;
    nomor_seri_prefix?: string | null;
    keterangan?: string | null;
  },
  actor?: UserSession
): Promise<{ success: boolean; assetsCreated?: AssetData[]; message?: string }> {
  await initializeMemoryStore();

  if (actor && !hasPermission(actor.role, 'asset.create')) {
    return { success: false, message: 'Role Anda tidak memiliki izin untuk menambah unit aset.' };
  }

  const group = memoryStore.assetGroups.find((g) => g.id === data.asset_group_id);
  if (!group) return { success: false, message: 'Jenis barang tidak ditemukan.' };

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && group.jurusan_kode !== scope.jurusanKode) {
    return { success: false, message: `Anda hanya dapat menambah unit untuk jurusan Anda sendiri (${scope.jurusanKode}).` };
  }

  const jur = memoryStore.jurusan.find((j) => j.id === group.jurusan_id);
  const room = data.ruangan_id
    ? memoryStore.rooms.find((r) => r.id === data.ruangan_id)
    : data.ruangan_nama
    ? memoryStore.rooms.find((r) => r.name.toLowerCase() === data.ruangan_nama?.toLowerCase())
    : memoryStore.rooms.find((r) => r.jurusan_id === group.jurusan_id) || memoryStore.rooms[0];

  const qty = Math.max(1, data.jumlah || 1);
  const { startingUnitNumber, unitCodes } = await generateNextUnitCodes(group.kode_kelompok, qty);
  const createdUnits: AssetData[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < unitCodes.length; i++) {
    const unitCode = unitCodes[i];
    const unitNum = startingUnitNumber + i;
    const sn = data.nomor_seri_prefix
      ? `${data.nomor_seri_prefix}-${String(unitNum).padStart(3, '0')}`
      : `SN-${group.jurusan_kode}-${group.kode_kelompok.split('-')[2]}-${String(unitNum).padStart(3, '0')}`;

    const newAsset: AssetData = {
      id: memoryStore.assets.length + 1,
      asset_group_id: group.id,
      kode_barang: unitCode,
      nomor_unit: unitNum,
      nama_barang: group.nama_barang,
      jurusan_kode: group.jurusan_kode,
      jurusan_nama: jur?.nama || group.jurusan_kode,
      merk: group.merk || null,
      tipe: group.tipe || null,
      nomor_seri: sn,
      ruangan_id: room ? room.id : null,
      ruangan_nama: room ? room.name : null,
      kondisi: (data.kondisi as any) || 'BAIK',
      status: 'TERSEDIA',
      tahun_perolehan: data.tahun_perolehan || new Date().getFullYear(),
      sumber_dana: data.sumber_dana || 'Dana BOS',
      harga_perolehan: data.harga_perolehan || 0,
      keterangan: data.keterangan || `Unit ${unitNum}`,
      created_by: actor?.id || 1,
      created_at: now,
      updated_at: now,
    };

    memoryStore.assets.push(newAsset);
    createdUnits.push(newAsset);

    // Record Asset History
    memoryStore.assetHistories.push({
      id: memoryStore.assetHistories.length + 1,
      asset_id: newAsset.id,
      kode_barang: newAsset.kode_barang,
      nama_barang: newAsset.nama_barang,
      user_id: actor?.id,
      user_name: actor?.name,
      action: 'CREATED',
      old_value: null,
      new_value: `Unit: ${unitCode}, Kondisi: ${newAsset.kondisi}, Lokasi: ${newAsset.ruangan_nama}`,
      description: `Unit fisik ${unitCode} ditambahkan ke sistem oleh ${actor?.name || 'Sistem'}.`,
      created_at: now,
    });
  }

  // Update group counters
  group.total_units = (group.total_units || 0) + qty;
  group.available_units = (group.available_units || 0) + qty;
  group.updated_at = now;

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'UNIT_ASSETS_CREATED',
    target: 'ASSET_GROUP',
    target_id: group.kode_kelompok,
    description: `Menambahkan ${qty} unit barang baru pada kelompok ${group.kode_kelompok} (${group.nama_barang}) oleh ${actor?.name || 'Sistem'}.`,
  });

  return {
    success: true,
    assetsCreated: createdUnits,
    message: `Berhasil menambahkan ${qty} unit (${unitCodes[0]} s/d ${unitCodes[unitCodes.length - 1]}).`,
  };
}

// ----------------------------------------------------
// ASSET MANAGEMENT (CRUD & INVENTORY)
// ----------------------------------------------------

export async function getAllAssets(
  filters?: {
    jurusanId?: number;
    jurusanKode?: string;
    kategoriId?: number;
    kategoriName?: string;
    ruanganId?: number;
    kondisi?: string;
    status?: string;
    search?: string;
    tahunPerolehan?: number;
  },
  actor?: UserSession | null
): Promise<AssetData[]> {
  await initializeMemoryStore();

  let result = [...memoryStore.assets];

  // Enforce Data Scope for KAKOM & LABORAN
  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode) {
    result = result.filter((a) => a.jurusan_kode === scope.jurusanKode);
  } else {
    if (filters?.jurusanId) {
      const jur = memoryStore.jurusan.find((j) => j.id === filters.jurusanId);
      if (jur) {
        result = result.filter((a) => a.jurusan_kode === jur.kode);
      }
    }

    if (filters?.jurusanKode && filters.jurusanKode !== 'SEMUA') {
      result = result.filter((a) => a.jurusan_kode === filters.jurusanKode);
    }
  }

  if (filters?.kategoriName && filters.kategoriName !== 'Semua Kategori' && filters.kategoriName !== 'SEMUA') {
    result = result.filter((a) => a.kategori?.toLowerCase() === filters.kategoriName?.toLowerCase());
  }

  if (filters?.kondisi && filters.kondisi !== 'Semua Kondisi' && filters.kondisi !== 'SEMUA') {
    const kNormalized = filters.kondisi.toUpperCase().replace(/\s+/g, '_');
    result = result.filter((a) => a.kondisi.toUpperCase().replace(/\s+/g, '_') === kNormalized);
  }

  if (filters?.status && filters.status !== 'SEMUA') {
    result = result.filter((a) => a.status === filters.status);
  }

  if (filters?.ruanganId) {
    result = result.filter((a) => a.ruangan_id === filters.ruanganId);
  }

  if (filters?.tahunPerolehan) {
    result = result.filter((a) => a.tahun_perolehan === filters.tahunPerolehan);
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (a) =>
        a.kode_barang.toLowerCase().includes(q) ||
        (a.nama_barang && a.nama_barang.toLowerCase().includes(q)) ||
        (a.merk && a.merk.toLowerCase().includes(q)) ||
        (a.nomor_seri && a.nomor_seri.toLowerCase().includes(q)) ||
        (a.kategori && a.kategori.toLowerCase().includes(q)) ||
        (a.ruangan_nama && a.ruangan_nama.toLowerCase().includes(q))
    );
  }

  // Sort by id descending
  result.sort((a, b) => b.id - a.id);
  return result;
}

export async function getAssetById(id: number, actor?: UserSession | null): Promise<AssetData | null> {
  await initializeMemoryStore();
  const asset = memoryStore.assets.find((a) => a.id === id);
  if (!asset) return null;

  // Enforce Data Scope
  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && asset.jurusan_kode !== scope.jurusanKode) {
    return null;
  }

  return asset;
}

export async function createAssetWithUnits(
  data: {
    nama_barang: string;
    jurusan_id: number;
    kategori_id?: number;
    kategori_name?: string;
    ruangan_id?: number;
    ruangan_nama?: string;
    ruangan?: string;
    merk?: string;
    tipe?: string;
    jumlah: number;
    kondisi: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' | string;
    tahun_perolehan?: number;
    sumber_dana?: string;
    harga_perolehan?: number;
    nomor_seri_prefix?: string;
    keterangan?: string;
  },
  actor?: UserSession
): Promise<{ success: boolean; group?: AssetGroupData; assetsCreated?: AssetData[]; message?: string }> {
  await initializeMemoryStore();

  if (actor && !hasPermission(actor.role, 'asset.create')) {
    return { success: false, message: 'Role Anda tidak memiliki hak akses untuk menambah aset.' };
  }

  // Kakom & Laboran only add for their own Jurusan
  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanId) {
    data.jurusan_id = scope.jurusanId;
  }

  const jur = memoryStore.jurusan.find((j) => j.id === data.jurusan_id);
  if (!jur) return { success: false, message: 'Jurusan tidak valid.' };

  if (scope.isScoped && scope.jurusanKode && jur.kode !== scope.jurusanKode) {
    return { success: false, message: `Anda hanya dapat menambah aset untuk jurusan Anda sendiri (${scope.jurusanKode}).` };
  }

  const targetRoomName = data.ruangan_nama || data.ruangan;
  const room = data.ruangan_id
    ? memoryStore.rooms.find((r) => r.id === data.ruangan_id)
    : targetRoomName
    ? memoryStore.rooms.find((r) => r.name.toLowerCase() === targetRoomName.toLowerCase() || (r.nama_ruangan && r.nama_ruangan.toLowerCase() === targetRoomName.toLowerCase()))
    : memoryStore.rooms.find((r) => r.jurusan_id === jur.id && r.is_active !== false) || memoryStore.rooms[0];

  // 1. Generate Group Code
  const groupCode = await generateNextAssetGroupCode(jur.kode);
  const now = new Date().toISOString();

  const newGroup: AssetGroupData = {
    id: memoryStore.assetGroups.length + 1,
    kode_kelompok: groupCode,
    nama_barang: data.nama_barang.trim(),
    jurusan_id: jur.id,
    jurusan_kode: jur.kode,
    merk: data.merk || null,
    tipe: data.tipe || null,
    satuan: 'Unit',
    total_units: data.jumlah,
    available_units: data.jumlah,
    created_at: now,
    updated_at: now,
  };
  memoryStore.assetGroups.push(newGroup);

  // 2. Generate Units
  const qty = Math.max(1, data.jumlah || 1);
  const { unitCodes } = await generateNextUnitCodes(groupCode, qty);
  const createdUnits: AssetData[] = [];

  for (let i = 0; i < unitCodes.length; i++) {
    const unitCode = unitCodes[i];
    const unitNum = i + 1;
    const sn = data.nomor_seri_prefix
      ? `${data.nomor_seri_prefix}-${String(unitNum).padStart(3, '0')}`
      : `SN-${jur.kode}-${groupCode.split('-')[2]}-${String(unitNum).padStart(3, '0')}`;

    const newAsset: AssetData = {
      id: memoryStore.assets.length + 1,
      asset_group_id: newGroup.id,
      kode_barang: unitCode,
      nomor_unit: unitNum,
      nama_barang: data.nama_barang.trim(),
      jurusan_id: jur.id,
      jurusan_kode: jur.kode,
      jurusan_nama: jur.nama,
      merk: data.merk || null,
      tipe: data.tipe || null,
      nomor_seri: sn,
      ruangan_id: room ? room.id : null,
      ruangan_nama: room ? (room.nama_ruangan || room.name) : null,
      kondisi: data.kondisi || 'BAIK',
      status: 'TERSEDIA',
      tahun_perolehan: data.tahun_perolehan || new Date().getFullYear(),
      sumber_dana: data.sumber_dana || 'BOS Reguler',
      harga_perolehan: data.harga_perolehan || 0,
      keterangan: data.keterangan || `Unit ${unitNum} dari ${qty}`,
      created_by: actor?.id || 1,
      created_at: now,
      updated_at: now,
    };

    memoryStore.assets.push(newAsset);
    createdUnits.push(newAsset);

    // Record Asset History
    memoryStore.assetHistories.push({
      id: memoryStore.assetHistories.length + 1,
      asset_id: newAsset.id,
      kode_barang: newAsset.kode_barang,
      nama_barang: newAsset.nama_barang,
      user_id: actor?.id,
      user_name: actor?.name,
      action: 'CREATED',
      old_value: null,
      new_value: `Kondisi: ${newAsset.kondisi}, Lokasi: ${newAsset.ruangan_nama}`,
      description: `Aset unit fisik baru didaftarkan ke sistem oleh ${actor?.name || 'Sistem'}.`,
      created_at: now,
    });
  }

  // Audit Log
  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'ASSET_CREATED',
    target: 'ASSET_GROUP',
    target_id: groupCode,
    description: `Kelompok aset ${groupCode} (${data.nama_barang}) sebanyak ${qty} unit dibuat oleh ${actor?.name || 'Sistem'}.`,
  });

  return {
    success: true,
    group: newGroup,
    assetsCreated: createdUnits,
    message: `Berhasil mendaftarkan ${qty} unit barang dengan kode kelompok ${groupCode}.`,
  };
}

export async function updateAsset(
  id: number,
  data: Partial<AssetData>,
  actor?: UserSession
): Promise<{ success: boolean; asset?: AssetData; message?: string }> {
  await initializeMemoryStore();

  if (actor && !hasPermission(actor.role, 'asset.update')) {
    return { success: false, message: 'Anda tidak memiliki hak akses untuk mengedit aset.' };
  }

  const asset = memoryStore.assets.find((a) => a.id === id);
  if (!asset) return { success: false, message: 'Aset tidak ditemukan.' };

  // Kakom/Laboran check
  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && asset.jurusan_kode !== scope.jurusanKode) {
    return { success: false, message: `Anda hanya dapat mengedit aset di jurusan Anda sendiri (${scope.jurusanKode}).` };
  }

  const now = new Date().toISOString();
  const oldKondisi = asset.kondisi;
  const oldRuangan = asset.ruangan_nama;

  if (data.nama_barang) asset.nama_barang = data.nama_barang.trim();
  if (data.merk !== undefined) asset.merk = data.merk;
  if (data.tipe !== undefined) asset.tipe = data.tipe;
  if (data.nomor_seri !== undefined) asset.nomor_seri = data.nomor_seri;
  if (data.kondisi) asset.kondisi = data.kondisi;
  if (data.status) asset.status = data.status;
  if (data.ruangan_id !== undefined) {
    asset.ruangan_id = data.ruangan_id;
    const r = memoryStore.rooms.find((rm) => rm.id === data.ruangan_id);
    if (r) asset.ruangan_nama = r.name;
  }
  if (data.tahun_perolehan !== undefined) asset.tahun_perolehan = data.tahun_perolehan;
  if (data.sumber_dana !== undefined) asset.sumber_dana = data.sumber_dana;
  if (data.harga_perolehan !== undefined) asset.harga_perolehan = data.harga_perolehan;
  if (data.keterangan !== undefined) asset.keterangan = data.keterangan;
  asset.updated_by = actor?.id;
  asset.updated_at = now;

  // History if condition or room changed
  if (oldKondisi !== asset.kondisi) {
    memoryStore.assetHistories.push({
      id: memoryStore.assetHistories.length + 1,
      asset_id: asset.id,
      kode_barang: asset.kode_barang,
      nama_barang: asset.nama_barang,
      user_id: actor?.id,
      user_name: actor?.name,
      action: 'KONDISI_CHANGED',
      old_value: oldKondisi,
      new_value: asset.kondisi,
      description: `Kondisi diubah dari ${oldKondisi} ke ${asset.kondisi} oleh ${actor?.name || 'Sistem'}.`,
      created_at: now,
    });
  }

  if (oldRuangan !== asset.ruangan_nama) {
    memoryStore.assetHistories.push({
      id: memoryStore.assetHistories.length + 1,
      asset_id: asset.id,
      kode_barang: asset.kode_barang,
      nama_barang: asset.nama_barang,
      user_id: actor?.id,
      user_name: actor?.name,
      action: 'LOCATION_CHANGED',
      old_value: oldRuangan || 'N/A',
      new_value: asset.ruangan_nama || 'N/A',
      description: `Lokasi aset dipindahkan ke ${asset.ruangan_nama} oleh ${actor?.name || 'Sistem'}.`,
      created_at: now,
    });
  }

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'ASSET_UPDATED',
    target: 'ASSET',
    target_id: asset.kode_barang,
    description: `Aset ${asset.kode_barang} (${asset.nama_barang}) diperbarui oleh ${actor?.name || 'Sistem'}.`,
  });

  return { success: true, asset, message: 'Data aset berhasil diperbarui.' };
}

export async function deleteAsset(
  id: number,
  actor?: UserSession
): Promise<{ success: boolean; message?: string }> {
  await initializeMemoryStore();

  if (actor && !hasPermission(actor.role, 'asset.delete')) {
    return { success: false, message: 'Anda tidak memiliki hak akses untuk menghapus aset.' };
  }

  const idx = memoryStore.assets.findIndex((a) => a.id === id);
  if (idx === -1) return { success: false, message: 'Aset tidak ditemukan.' };

  const asset = memoryStore.assets[idx];

  if (asset.status === 'DIPINJAM') {
    return { success: false, message: 'Tidak dapat menghapus aset yang sedang dalam status dipinjam.' };
  }

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && asset.jurusan_kode !== scope.jurusanKode) {
    return { success: false, message: `Anda hanya dapat menghapus aset di jurusan Anda sendiri (${scope.jurusanKode}).` };
  }

  memoryStore.assets.splice(idx, 1);

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'ASSET_DELETED',
    target: 'ASSET',
    target_id: asset.kode_barang,
    description: `Aset ${asset.kode_barang} (${asset.nama_barang}) dihapus dari inventaris oleh ${actor?.name || 'Sistem'}.`,
  });

  return { success: true, message: 'Aset berhasil dihapus.' };
}

export async function getAssetByCode(
  code: string,
  actor?: UserSession | null
): Promise<AssetData | null> {
  await initializeMemoryStore();
  const trimmed = code.trim().toLowerCase();
  const asset = memoryStore.assets.find(
    (a) => a.kode_barang.toLowerCase() === trimmed
  );
  if (!asset) return null;

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && asset.jurusan_kode !== scope.jurusanKode) {
    return null;
  }

  return asset;
}

export async function getAssetWithFullRelations(
  idOrCode: number | string,
  actor?: UserSession | null
): Promise<{
  asset: AssetData;
  assetGroup: AssetGroupData | null;
  maintenances: AssetMaintenanceData[];
  borrowingHistory: BorrowingData[];
  histories: AssetHistoryData[];
} | null> {
  await initializeMemoryStore();

  let asset: AssetData | undefined;
  if (typeof idOrCode === 'number' || !isNaN(Number(idOrCode))) {
    const numId = Number(idOrCode);
    asset = memoryStore.assets.find((a) => a.id === numId);
  } else {
    const trimmed = String(idOrCode).trim().toLowerCase();
    asset = memoryStore.assets.find((a) => a.kode_barang.toLowerCase() === trimmed);
  }

  if (!asset) return null;

  // Enforce data scope for KAKOM & LABORAN
  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && asset.jurusan_kode !== scope.jurusanKode) {
    return null;
  }

  // 1. Get Parent Group / Jenis Barang
  const assetGroup = memoryStore.assetGroups.find((g) => g.id === asset!.asset_group_id) || null;

  // 2. Get Maintenances for this unit
  const maintenances = memoryStore.assetMaintenances
    .filter((m) => m.asset_id === asset!.id)
    .sort((a, b) => new Date(b.tanggal_perawatan).getTime() - new Date(a.tanggal_perawatan).getTime());

  // 3. Get Borrowings involving this unit
  const borrowingHistory = memoryStore.borrowings
    .filter((b) => b.items.some((it) => it.asset_id === asset!.id))
    .sort((a, b) => b.id - a.id);

  // 4. Get Asset Change Histories
  const histories = memoryStore.assetHistories
    .filter((h) => h.asset_id === asset!.id)
    .sort((a, b) => b.id - a.id);

  return {
    asset,
    assetGroup,
    maintenances,
    borrowingHistory,
    histories,
  };
}

// ----------------------------------------------------
// ASSET MAINTENANCE / PERAWATAN SYSTEM
// ----------------------------------------------------

export async function getAssetMaintenances(
  filters?: {
    assetId?: number;
    jurusanKode?: string;
    status?: string;
    search?: string;
  },
  actor?: UserSession | null
): Promise<AssetMaintenanceData[]> {
  await initializeMemoryStore();

  let list = [...memoryStore.assetMaintenances];

  // Enforce Data Scope for KAKOM & LABORAN
  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode) {
    const allowedAssetIds = new Set(
      memoryStore.assets
        .filter((a) => a.jurusan_kode === scope.jurusanKode)
        .map((a) => a.id)
    );
    list = list.filter((m) => allowedAssetIds.has(m.asset_id));
  } else {
    if (filters?.jurusanKode && filters.jurusanKode !== 'SEMUA') {
      const allowedAssetIds = new Set(
        memoryStore.assets
          .filter((a) => a.jurusan_kode === filters.jurusanKode)
          .map((a) => a.id)
      );
      list = list.filter((m) => allowedAssetIds.has(m.asset_id));
    }
  }

  if (filters?.assetId) {
    list = list.filter((m) => m.asset_id === filters.assetId);
  }

  if (filters?.status && filters.status !== 'SEMUA') {
    list = list.filter((m) => m.status === filters.status);
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (m) =>
        (m.kode_barang && m.kode_barang.toLowerCase().includes(q)) ||
        (m.nama_barang && m.nama_barang.toLowerCase().includes(q)) ||
        m.jenis_perawatan.toLowerCase().includes(q) ||
        m.pelaksana.toLowerCase().includes(q) ||
        m.deskripsi.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => new Date(b.tanggal_perawatan).getTime() - new Date(a.tanggal_perawatan).getTime());
  return list;
}

export async function getAssetMaintenanceById(
  id: number,
  actor?: UserSession | null
): Promise<AssetMaintenanceData | null> {
  await initializeMemoryStore();
  const item = memoryStore.assetMaintenances.find((m) => m.id === id);
  if (!item) return null;

  const asset = memoryStore.assets.find((a) => a.id === item.asset_id);
  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && asset && asset.jurusan_kode !== scope.jurusanKode) {
    return null;
  }

  return item;
}

export async function createAssetMaintenance(
  data: {
    asset_id: number;
    tanggal_perawatan: string;
    jenis_perawatan: string;
    deskripsi: string;
    pelaksana: string;
    biaya: number;
    kondisi_sebelum: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' | string;
    kondisi_sesudah: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' | string;
    status?: 'DIJADWALKAN' | 'PROSES' | 'SELESAI' | 'DIBATALKAN' | string;
    catatan?: string | null;
  },
  actor?: UserSession
): Promise<{ success: boolean; maintenance?: AssetMaintenanceData; message?: string }> {
  await initializeMemoryStore();

  if (actor && !hasPermission(actor.role, 'asset.update')) {
    return { success: false, message: 'Role Anda tidak memiliki izin untuk mencatat perawatan aset.' };
  }

  const asset = memoryStore.assets.find((a) => a.id === data.asset_id);
  if (!asset) return { success: false, message: 'Unit aset tidak ditemukan.' };

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && asset.jurusan_kode !== scope.jurusanKode) {
    return { success: false, message: `Anda hanya dapat mencatat perawatan pada jurusan Anda sendiri (${scope.jurusanKode}).` };
  }

  const now = new Date().toISOString();
  const status = data.status || 'SELESAI';

  const newMaintenance: AssetMaintenanceData = {
    id: memoryStore.assetMaintenances.length + 1,
    asset_id: asset.id,
    kode_barang: asset.kode_barang,
    nama_barang: asset.nama_barang,
    tanggal_perawatan: data.tanggal_perawatan || new Date().toISOString().slice(0, 10),
    jenis_perawatan: data.jenis_perawatan.trim(),
    deskripsi: data.deskripsi.trim(),
    pelaksana: data.pelaksana.trim(),
    biaya: Number(data.biaya) || 0,
    kondisi_sebelum: data.kondisi_sebelum || asset.kondisi,
    kondisi_sesudah: data.kondisi_sesudah || data.kondisi_sebelum || asset.kondisi,
    status: status,
    catatan: data.catatan ? data.catatan.trim() : null,
    created_by: actor?.id || 1,
    created_by_name: actor?.name || 'Sistem',
    created_at: now,
    updated_at: now,
  };

  memoryStore.assetMaintenances.push(newMaintenance);

  // Update Asset Status & Condition based on maintenance status
  const prevStatus = asset.status;
  const prevCondition = asset.kondisi;

  if (status === 'PROSES' || status === 'DIJADWALKAN') {
    asset.status = 'PERAWATAN';
  } else if (status === 'SELESAI') {
    asset.kondisi = data.kondisi_sesudah as any;
    if (data.kondisi_sesudah === 'RUSAK_BERAT') {
      asset.status = 'RUSAK';
    } else if (data.kondisi_sesudah === 'RUSAK_RINGAN') {
      asset.status = 'PERBAIKAN';
    } else {
      asset.status = 'TERSEDIA';
    }
  }
  asset.updated_at = now;

  // Insert into Asset Histories
  memoryStore.assetHistories.push({
    id: memoryStore.assetHistories.length + 1,
    asset_id: asset.id,
    kode_barang: asset.kode_barang,
    nama_barang: asset.nama_barang,
    user_id: actor?.id,
    user_name: actor?.name,
    action: 'MAINTAINED',
    old_value: `Status: ${prevStatus}, Kondisi: ${prevCondition}`,
    new_value: `Status: ${asset.status}, Kondisi: ${asset.kondisi}`,
    description: `Perawatan (${data.jenis_perawatan}) dicatat oleh ${actor?.name || 'Sistem'}. Pelaksana: ${data.pelaksana}. Status: ${status}.`,
    created_at: now,
  });

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'ASSET_MAINTENANCE_CREATED',
    target: 'MAINTENANCE',
    target_id: asset.kode_barang,
    description: `Catatan perawatan unit ${asset.kode_barang} (${data.jenis_perawatan}) dibuat oleh ${actor?.name || 'Sistem'}.`,
  });

  return {
    success: true,
    maintenance: newMaintenance,
    message: 'Catatan perawatan berhasil disimpan dan status aset telah diperbarui.',
  };
}

export async function updateAssetMaintenance(
  id: number,
  data: Partial<AssetMaintenanceData>,
  actor?: UserSession
): Promise<{ success: boolean; maintenance?: AssetMaintenanceData; message?: string }> {
  await initializeMemoryStore();

  if (actor && !hasPermission(actor.role, 'asset.update')) {
    return { success: false, message: 'Role Anda tidak memiliki izin untuk mengedit catatan perawatan.' };
  }

  const item = memoryStore.assetMaintenances.find((m) => m.id === id);
  if (!item) return { success: false, message: 'Catatan perawatan tidak ditemukan.' };

  const asset = memoryStore.assets.find((a) => a.id === item.asset_id);
  if (!asset) return { success: false, message: 'Unit aset terkait tidak ditemukan.' };

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && asset.jurusan_kode !== scope.jurusanKode) {
    return { success: false, message: `Anda hanya dapat mengedit perawatan pada jurusan Anda sendiri (${scope.jurusanKode}).` };
  }

  const now = new Date().toISOString();

  if (data.tanggal_perawatan) item.tanggal_perawatan = data.tanggal_perawatan;
  if (data.jenis_perawatan) item.jenis_perawatan = data.jenis_perawatan.trim();
  if (data.deskripsi) item.deskripsi = data.deskripsi.trim();
  if (data.pelaksana) item.pelaksana = data.pelaksana.trim();
  if (data.biaya !== undefined) item.biaya = Number(data.biaya) || 0;
  if (data.kondisi_sebelum) item.kondisi_sebelum = data.kondisi_sebelum;
  if (data.kondisi_sesudah) item.kondisi_sesudah = data.kondisi_sesudah;
  if (data.catatan !== undefined) item.catatan = data.catatan;
  if (data.status) item.status = data.status;
  item.updated_at = now;

  // If status is updated, update asset status as well
  if (item.status === 'SELESAI') {
    asset.kondisi = item.kondisi_sesudah as any;
    if (item.kondisi_sesudah === 'RUSAK_BERAT') {
      asset.status = 'RUSAK';
    } else if (item.kondisi_sesudah === 'RUSAK_RINGAN') {
      asset.status = 'PERBAIKAN';
    } else {
      asset.status = 'TERSEDIA';
    }
    asset.updated_at = now;
  } else if (item.status === 'PROSES' || item.status === 'DIJADWALKAN') {
    asset.status = 'PERAWATAN';
    asset.updated_at = now;
  }

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'ASSET_MAINTENANCE_UPDATED',
    target: 'MAINTENANCE',
    target_id: asset.kode_barang,
    description: `Catatan perawatan #${id} (${item.jenis_perawatan}) untuk ${asset.kode_barang} diperbarui oleh ${actor?.name || 'Sistem'}.`,
  });

  return {
    success: true,
    maintenance: item,
    message: 'Catatan perawatan berhasil diperbarui.',
  };
}

export async function deleteAssetMaintenance(
  id: number,
  actor?: UserSession
): Promise<{ success: boolean; message?: string }> {
  await initializeMemoryStore();

  if (actor && !hasPermission(actor.role, 'asset.delete') && actor.role !== 'SUPER_ADMIN' && actor.role !== 'OPERATOR') {
    return { success: false, message: 'Role Anda tidak memiliki izin untuk menghapus catatan perawatan.' };
  }

  const idx = memoryStore.assetMaintenances.findIndex((m) => m.id === id);
  if (idx === -1) return { success: false, message: 'Catatan perawatan tidak ditemukan.' };

  const item = memoryStore.assetMaintenances[idx];
  const asset = memoryStore.assets.find((a) => a.id === item.asset_id);

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && asset && asset.jurusan_kode !== scope.jurusanKode) {
    return { success: false, message: `Anda hanya dapat menghapus catatan perawatan di jurusan Anda sendiri (${scope.jurusanKode}).` };
  }

  memoryStore.assetMaintenances.splice(idx, 1);

  await logAudit({
    user_id: actor?.id,
    user_name: actor?.name,
    user_role: actor?.role,
    action: 'ASSET_MAINTENANCE_DELETED',
    target: 'MAINTENANCE',
    target_id: String(id),
    description: `Catatan perawatan #${id} dihapus oleh ${actor?.name || 'Sistem'}.`,
  });

  return { success: true, message: 'Catatan perawatan berhasil dihapus.' };
}

// ----------------------------------------------------
// BORROWING & WORKFLOW APPROVAL ENGINE
// ----------------------------------------------------

export async function getAllBorrowings(
  filters?: {
    jurusanId?: number;
    jurusanKode?: string;
    userId?: number;
    status?: string;
  },
  actor?: UserSession | null
): Promise<BorrowingData[]> {
  await initializeMemoryStore();

  let result = [...memoryStore.borrowings];

  // Enforce Data Scope for KAKOM & LABORAN
  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode) {
    result = result.filter((b) => b.jurusan_kode === scope.jurusanKode);
  } else {
    if (filters?.jurusanId) {
      result = result.filter((b) => b.jurusan_id === filters.jurusanId);
    }

    if (filters?.jurusanKode && filters.jurusanKode !== 'SEMUA') {
      result = result.filter((b) => b.jurusan_kode === filters.jurusanKode);
    }
  }

  if (filters?.userId) {
    result = result.filter((b) => b.user_id === filters.userId);
  }

  if (filters?.status && filters.status !== 'SEMUA') {
    result = result.filter((b) => b.status === filters.status);
  }

  result.sort((a, b) => b.id - a.id);
  return result;
}

export async function getBorrowingById(id: number, actor?: UserSession | null): Promise<BorrowingData | null> {
  await initializeMemoryStore();
  const b = memoryStore.borrowings.find((item) => item.id === id);
  if (!b) return null;

  // Enforce Data Scope
  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && b.jurusan_kode !== scope.jurusanKode) {
    return null;
  }

  return b;
}

export async function createBorrowingRequest(
  data: {
    jurusan_id: number;
    tanggal_peminjaman: string;
    tanggal_pengembalian_rencana: string;
    tujuan: string;
    keperluan: string;
    catatan?: string;
    asset_ids: number[];
  },
  actor: UserSession
): Promise<{ success: boolean; borrowing?: BorrowingData; message?: string }> {
  await initializeMemoryStore();

  if (!hasPermission(actor.role, 'borrowing.create')) {
    return { success: false, message: 'Hanya Laboran atau Super Admin yang dapat membuat pengajuan peminjaman.' };
  }

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanId) {
    data.jurusan_id = scope.jurusanId;
  }

  if (!data.asset_ids || data.asset_ids.length === 0) {
    return { success: false, message: 'Pilih minimal 1 unit aset yang akan dipinjam.' };
  }

  // Validate selected assets availability and department scope
  const selectedAssets: AssetData[] = [];
  for (const aId of data.asset_ids) {
    const ast = memoryStore.assets.find((a) => a.id === aId);
    if (!ast) {
      return { success: false, message: `Aset dengan ID #${aId} tidak ditemukan.` };
    }
    if (scope.isScoped && scope.jurusanKode && ast.jurusan_kode !== scope.jurusanKode) {
      return {
        success: false,
        message: `Aset ${ast.kode_barang} berasal dari jurusan lain (${ast.jurusan_kode}) dan tidak dapat dipinjam.`,
      };
    }
    if (ast.status !== 'TERSEDIA') {
      return {
        success: false,
        message: `Aset ${ast.kode_barang} (${ast.nama_barang}) tidak tersedia untuk dipinjam (Status: ${ast.status}).`,
      };
    }
    if (ast.kondisi === 'RUSAK_BERAT') {
      return {
        success: false,
        message: `Aset ${ast.kode_barang} dalam kondisi Rusak Berat dan tidak boleh diajukan untuk peminjaman.`,
      };
    }
    selectedAssets.push(ast);
  }

  const jur = memoryStore.jurusan.find((j) => j.id === data.jurusan_id);
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(memoryStore.borrowings.length + 1).padStart(4, '0');
  const nomorPengajuan = `REQ-${yyyymmdd}-${seq}`;

  const newBorrowing: BorrowingData = {
    id: memoryStore.borrowings.length + 1,
    nomor_pengajuan: nomorPengajuan,
    user_id: actor.id,
    user_name: actor.name,
    jurusan_id: data.jurusan_id,
    jurusan_kode: jur?.kode || 'UMUM',
    jurusan_nama: jur?.nama || 'Umum',
    tanggal_pengajuan: now.toISOString(),
    tanggal_peminjaman: data.tanggal_peminjaman,
    tanggal_pengembalian_rencana: data.tanggal_pengembalian_rencana,
    tujuan: data.tujuan.trim(),
    keperluan: data.keperluan.trim(),
    status: 'MENUNGGU_PERSETUJUAN_KAKOM',
    catatan: data.catatan || null,
    items: selectedAssets.map((ast, i) => ({
      id: i + 1,
      borrowing_id: memoryStore.borrowings.length + 1,
      asset_id: ast.id,
      kode_barang: ast.kode_barang,
      nama_barang: ast.nama_barang || 'Aset',
      kondisi_sebelum: ast.kondisi,
    })),
    approvals: [],
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  memoryStore.borrowings.push(newBorrowing);

  // Notify Kakom of this Jurusan
  memoryStore.notifications.push({
    id: memoryStore.notifications.length + 1,
    user_id: 'all',
    title: 'Pengajuan Peminjaman Baru',
    message: `${actor.name} mengajukan peminjaman ${selectedAssets.length} item aset (${nomorPengajuan}). Menunggu persetujuan Kakom ${jur?.kode}.`,
    is_read: false,
    created_at: now,
  });

  await logAudit({
    user_id: actor.id,
    user_name: actor.name,
    user_role: actor.role,
    action: 'BORROWING_SUBMITTED',
    target: 'BORROWING',
    target_id: nomorPengajuan,
    description: `Pengajuan peminjaman ${nomorPengajuan} diajukan oleh ${actor.name} (${actor.role}).`,
  });

  return { success: true, borrowing: newBorrowing, message: 'Pengajuan peminjaman berhasil dibuat dan dikirim ke Kakom.' };
}

// APPROVAL WORKFLOW HANDLER
export async function approveBorrowing(
  borrowingId: number,
  catatan: string,
  actor: UserSession
): Promise<{ success: boolean; borrowing?: BorrowingData; message?: string }> {
  await initializeMemoryStore();

  const b = memoryStore.borrowings.find((item) => item.id === borrowingId);
  if (!b) return { success: false, message: 'Pengajuan tidak ditemukan.' };

  const now = new Date().toISOString();

  // 1. TAHAP KAKOM
  if (actor.role === 'KAKOM') {
    if (b.status !== 'MENUNGGU_PERSETUJUAN_KAKOM') {
      return {
        success: false,
        message: `Tidak dapat menyetujui. Status pengajuan saat ini adalah: ${b.status}.`,
      };
    }
    if (actor.jurusan_id && actor.jurusan_id !== b.jurusan_id) {
      return {
        success: false,
        message: 'Kakom hanya memiliki kewenangan menyetujui pengajuan pada jurusannya sendiri.',
      };
    }

    b.status = 'MENUNGGU_PERSETUJUAN_SARPRAS';
    b.approvals.push({
      id: b.approvals.length + 1,
      borrowing_id: b.id,
      user_id: actor.id,
      user_name: actor.name,
      role: actor.role,
      status: 'APPROVED',
      catatan: catatan || 'Disetujui oleh Kepala Kompetensi Keahlian (Kakom).',
      approved_at: now,
    });
    b.updated_at = now;

    memoryStore.notifications.push({
      id: memoryStore.notifications.length + 1,
      user_id: 'all',
      title: 'Persetujuan Tahap 1 Selesai (Kakom)',
      message: `Pengajuan ${b.nomor_pengajuan} disetujui Kakom ${b.jurusan_kode}. Diteruskan ke Waka Sarpras.`,
      is_read: false,
      created_at: new Date(),
    });

    await logAudit({
      user_id: actor.id,
      user_name: actor.name,
      user_role: actor.role,
      action: 'APPROVAL_KAKOM',
      target: 'BORROWING',
      target_id: b.nomor_pengajuan,
      description: `Kakom ${actor.name} menyetujui pengajuan ${b.nomor_pengajuan}.`,
    });

    return { success: true, borrowing: b, message: 'Pengajuan disetujui Kakom dan diteruskan ke Waka Sarpras.' };
  }

  // 2. TAHAP WAKA SARPRAS
  if (actor.role === 'WAKA_SARPRAS') {
    if (b.status !== 'MENUNGGU_PERSETUJUAN_SARPRAS') {
      return {
        success: false,
        message: 'Waka Sarpras hanya dapat menyetujui pengajuan yang telah disetujui oleh Kakom.',
      };
    }

    b.status = 'MENUNGGU_PERSETUJUAN_KEPALA_SEKOLAH';
    b.approvals.push({
      id: b.approvals.length + 1,
      borrowing_id: b.id,
      user_id: actor.id,
      user_name: actor.name,
      role: actor.role,
      status: 'APPROVED',
      catatan: catatan || 'Disetujui oleh Waka Sarana & Prasarana.',
      approved_at: now,
    });
    b.updated_at = now;

    memoryStore.notifications.push({
      id: memoryStore.notifications.length + 1,
      user_id: 'all',
      title: 'Persetujuan Tahap 2 Selesai (Sarpras)',
      message: `Pengajuan ${b.nomor_pengajuan} disetujui Waka Sarpras. Menunggu persetujuan akhir Kepala Sekolah.`,
      is_read: false,
      created_at: new Date(),
    });

    await logAudit({
      user_id: actor.id,
      user_name: actor.name,
      user_role: actor.role,
      action: 'APPROVAL_SARPRAS',
      target: 'BORROWING',
      target_id: b.nomor_pengajuan,
      description: `Waka Sarpras ${actor.name} menyetujui pengajuan ${b.nomor_pengajuan}.`,
    });

    return { success: true, borrowing: b, message: 'Pengajuan disetujui Sarpras dan diteruskan ke Kepala Sekolah.' };
  }

  // 3. TAHAP KEPALA SEKOLAH
  if (actor.role === 'KEPALA_SEKOLAH') {
    if (b.status !== 'MENUNGGU_PERSETUJUAN_KEPALA_SEKOLAH') {
      return {
        success: false,
        message: 'Kepala Sekolah hanya dapat memberikan persetujuan akhir setelah disetujui oleh Waka Sarpras.',
      };
    }

    b.status = 'DISETUJUI';
    b.approvals.push({
      id: b.approvals.length + 1,
      borrowing_id: b.id,
      user_id: actor.id,
      user_name: actor.name,
      role: actor.role,
      status: 'APPROVED',
      catatan: catatan || 'Disetujui oleh Kepala Sekolah.',
      approved_at: now,
    });
    b.updated_at = now;

    memoryStore.notifications.push({
      id: memoryStore.notifications.length + 1,
      user_id: 'all',
      title: 'Pengajuan Peminjaman Telah DISETUJUI',
      message: `Pengajuan ${b.nomor_pengajuan} telah disetujui oleh Kepala Sekolah. Barang dapat diserahterimakan oleh Laboran.`,
      is_read: false,
      created_at: new Date(),
    });

    await logAudit({
      user_id: actor.id,
      user_name: actor.name,
      user_role: actor.role,
      action: 'APPROVAL_KEPALA_SEKOLAH',
      target: 'BORROWING',
      target_id: b.nomor_pengajuan,
      description: `Kepala Sekolah ${actor.name} memberikan persetujuan final untuk ${b.nomor_pengajuan}.`,
    });

    return { success: true, borrowing: b, message: 'Peminjaman telah disetujui secara resmi oleh Kepala Sekolah.' };
  }

  // 4. SUPER ADMIN (OVERRIDE DENGAN AUDIT KHUSUS)
  if (actor.role === 'SUPER_ADMIN') {
    b.status = 'DISETUJUI';
    b.approvals.push({
      id: b.approvals.length + 1,
      borrowing_id: b.id,
      user_id: actor.id,
      user_name: actor.name,
      role: actor.role,
      status: 'OVERRIDDEN',
      catatan: `[OVERRIDE SUPER ADMIN] ${catatan || 'Persetujuan langsung oleh Super Admin.'}`,
      approved_at: now,
    });
    b.updated_at = now;

    await logAudit({
      user_id: actor.id,
      user_name: actor.name,
      user_role: actor.role,
      action: 'APPROVAL_OVERRIDE',
      target: 'BORROWING',
      target_id: b.nomor_pengajuan,
      description: `[CRITICAL] Super Admin ${actor.name} melakukan OVERRIDE persetujuan pada ${b.nomor_pengajuan}.`,
    });

    return { success: true, borrowing: b, message: 'Persetujuan override berhasil dicatat di audit log.' };
  }

  return { success: false, message: 'Role Anda tidak memiliki kewenangan untuk menyetujui pengajuan ini.' };
}

// REJECT WORKFLOW HANDLER
export async function rejectBorrowing(
  borrowingId: number,
  alasanPenolakan: string,
  actor: UserSession
): Promise<{ success: boolean; borrowing?: BorrowingData; message?: string }> {
  await initializeMemoryStore();

  const b = memoryStore.borrowings.find((item) => item.id === borrowingId);
  if (!b) return { success: false, message: 'Pengajuan tidak ditemukan.' };

  if (!alasanPenolakan || !alasanPenolakan.trim()) {
    return { success: false, message: 'Alasan/catatan penolakan wajib diisi.' };
  }

  const now = new Date().toISOString();

  if (actor.role === 'KAKOM') {
    if (b.status !== 'MENUNGGU_PERSETUJUAN_KAKOM') {
      return { success: false, message: 'Pengajuan tidak berada pada tahap persetujuan Kakom.' };
    }
    if (actor.jurusan_id && actor.jurusan_id !== b.jurusan_id) {
      return { success: false, message: 'Kakom hanya memproses pengajuan jurusannya sendiri.' };
    }
    b.status = 'DITOLAK_KAKOM';
  } else if (actor.role === 'WAKA_SARPRAS') {
    if (b.status !== 'MENUNGGU_PERSETUJUAN_SARPRAS') {
      return { success: false, message: 'Pengajuan tidak berada pada tahap persetujuan Waka Sarpras.' };
    }
    b.status = 'DITOLAK_SARPRAS';
  } else if (actor.role === 'KEPALA_SEKOLAH') {
    if (b.status !== 'MENUNGGU_PERSETUJUAN_KEPALA_SEKOLAH') {
      return { success: false, message: 'Pengajuan tidak berada pada tahap persetujuan Kepala Sekolah.' };
    }
    b.status = 'DITOLAK_KEPALA_SEKOLAH';
  } else if (actor.role === 'SUPER_ADMIN') {
    b.status = 'DIBATALKAN';
  } else {
    return { success: false, message: 'Anda tidak memiliki hak akses untuk menolak pengajuan.' };
  }

  b.approvals.push({
    id: b.approvals.length + 1,
    borrowing_id: b.id,
    user_id: actor.id,
    user_name: actor.name,
    role: actor.role,
    status: 'REJECTED',
    catatan: alasanPenolakan.trim(),
    approved_at: now,
  });
  b.updated_at = now;

  memoryStore.notifications.push({
    id: memoryStore.notifications.length + 1,
    user_id: 'all',
    title: 'Pengajuan Peminjaman Ditolak',
    message: `Pengajuan ${b.nomor_pengajuan} ditolak oleh ${actor.name} (${actor.role}). Alasan: ${alasanPenolakan}`,
    is_read: false,
    created_at: new Date(),
  });

  await logAudit({
    user_id: actor.id,
    user_name: actor.name,
    user_role: actor.role,
    action: 'APPROVAL_REJECTED',
    target: 'BORROWING',
    target_id: b.nomor_pengajuan,
    description: `Pengajuan ${b.nomor_pengajuan} ditolak oleh ${actor.name} (${actor.role}). Alasan: ${alasanPenolakan}`,
  });

  return { success: true, borrowing: b, message: `Pengajuan telah ditolak oleh ${actor.name}.` };
}

// HANDOVER / REALIZATION (DISETUJUI -> DIPINJAM)
export async function handoverBorrowing(
  borrowingId: number,
  actor: UserSession
): Promise<{ success: boolean; message?: string }> {
  await initializeMemoryStore();

  const b = memoryStore.borrowings.find((item) => item.id === borrowingId);
  if (!b) return { success: false, message: 'Pengajuan tidak ditemukan.' };

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && b.jurusan_kode !== scope.jurusanKode) {
    return { success: false, message: `Laboran hanya dapat menyerahterimakan barang pada jurusannya sendiri (${scope.jurusanKode}).` };
  }

  if (b.status !== 'DISETUJUI') {
    return { success: false, message: 'Barang hanya dapat diserahterimakan setelah berstatus DISETUJUI.' };
  }

  const now = new Date().toISOString();
  b.status = 'DIPINJAM';
  b.updated_at = now;

  // Mark all assets as DIPINJAM
  for (const item of b.items) {
    const ast = memoryStore.assets.find((a) => a.id === item.asset_id);
    if (ast) {
      ast.status = 'DIPINJAM';
      ast.updated_at = now;

      memoryStore.assetHistories.push({
        id: memoryStore.assetHistories.length + 1,
        asset_id: ast.id,
        kode_barang: ast.kode_barang,
        nama_barang: ast.nama_barang,
        user_id: actor.id,
        user_name: actor.name,
        action: 'BORROWED',
        old_value: 'TERSEDIA',
        new_value: 'DIPINJAM',
        description: `Barang keluar dipinjam untuk keperluan: ${b.tujuan} (${b.nomor_pengajuan}).`,
        created_at: now,
      });
    }
  }

  await logAudit({
    user_id: actor.id,
    user_name: actor.name,
    user_role: actor.role,
    action: 'BORROWING_HANDOVER',
    target: 'BORROWING',
    target_id: b.nomor_pengajuan,
    description: `Barang fisik untuk pengajuan ${b.nomor_pengajuan} telah diserahterimakan (Status: DIPINJAM).`,
  });

  return { success: true, message: 'Barang berhasil diserahterimakan dan status aset berubah menjadi DIPINJAM.' };
}

// RETURN ASSET (DIPINJAM -> DIKEMBALIKAN)
export async function returnBorrowing(
  borrowingId: number,
  itemConditions: Array<{ asset_id: number; kondisi_sesudah: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT'; catatan?: string }>,
  actor: UserSession
): Promise<{ success: boolean; message?: string }> {
  await initializeMemoryStore();

  if (!hasPermission(actor.role, 'borrowing.return')) {
    return { success: false, message: 'Hanya Laboran atau Super Admin yang dapat memproses pengembalian barang.' };
  }

  const b = memoryStore.borrowings.find((item) => item.id === borrowingId);
  if (!b) return { success: false, message: 'Pengajuan tidak ditemukan.' };

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode && b.jurusan_kode !== scope.jurusanKode) {
    return { success: false, message: `Laboran hanya dapat memproses pengembalian barang pada jurusannya sendiri (${scope.jurusanKode}).` };
  }

  if (b.status !== 'DIPINJAM' && b.status !== 'DISETUJUI') {
    return { success: false, message: 'Pengajuan tidak dalam status peminjaman aktif.' };
  }

  const now = new Date();
  b.status = 'DIKEMBALIKAN';
  b.tanggal_pengembalian_realisasi = now.toISOString().slice(0, 10);
  b.updated_at = now.toISOString();

  // Update each item and physical unit asset
  for (const cond of itemConditions) {
    const item = b.items.find((it) => it.asset_id === cond.asset_id);
    if (item) {
      item.kondisi_sesudah = cond.kondisi_sesudah;
      item.catatan = cond.catatan || null;
    }

    const ast = memoryStore.assets.find((a) => a.id === cond.asset_id);
    if (ast) {
      const oldCond = ast.kondisi;
      ast.kondisi = cond.kondisi_sesudah;
      ast.status = cond.kondisi_sesudah === 'RUSAK_BERAT' ? 'RUSAK' : cond.kondisi_sesudah === 'RUSAK_RINGAN' ? 'PERBAIKAN' : 'TERSEDIA';
      ast.updated_at = now.toISOString();

      memoryStore.assetHistories.push({
        id: memoryStore.assetHistories.length + 1,
        asset_id: ast.id,
        kode_barang: ast.kode_barang,
        nama_barang: ast.nama_barang,
        user_id: actor.id,
        user_name: actor.name,
        action: 'RETURNED',
        old_value: `Status: DIPINJAM, Kondisi: ${oldCond}`,
        new_value: `Status: ${ast.status}, Kondisi: ${ast.kondisi}`,
        description: `Barang dikembalikan dari peminjaman ${b.nomor_pengajuan}. Kondisi: ${ast.kondisi}. Catatan: ${cond.catatan || '-'}`,
        created_at: now.toISOString(),
      });
    }
  }

  memoryStore.notifications.push({
    id: memoryStore.notifications.length + 1,
    user_id: 'all',
    title: 'Pengembalian Barang Selesai',
    message: `Barang dari peminjaman ${b.nomor_pengajuan} telah dikembalikan dan diverifikasi oleh ${actor.name}.`,
    is_read: false,
    created_at: now,
  });

  await logAudit({
    user_id: actor.id,
    user_name: actor.name,
    user_role: actor.role,
    action: 'BORROWING_RETURNED',
    target: 'BORROWING',
    target_id: b.nomor_pengajuan,
    description: `Barang untuk pengajuan ${b.nomor_pengajuan} telah dikembalikan oleh Laboran ${actor.name}.`,
  });

  return { success: true, message: 'Pengembalian barang berhasil diproses dan status inventaris telah diperbarui.' };
}

// ----------------------------------------------------
// AUDIT LOGS & HISTORIES
// ----------------------------------------------------

export async function logAudit(data: {
  user_id?: number | null;
  user_name?: string | null;
  user_role?: string | null;
  action: string;
  target?: string | null;
  target_id?: string | null;
  description?: string | null;
  ip_address?: string | null;
}) {
  const newLog: AuditLogData = {
    id: memoryStore.auditLogs.length + 1,
    user_id: data.user_id || null,
    user_name: data.user_name || 'Sistem',
    user_role: data.user_role || null,
    action: data.action,
    target: data.target || null,
    target_id: data.target_id || null,
    description: data.description || null,
    ip_address: data.ip_address || '127.0.0.1',
    created_at: new Date().toISOString(),
  };
  memoryStore.auditLogs.unshift(newLog);

  if (isDbConnected && db) {
    try {
      await db.insert(auditLogsTable).values({
        user_id: data.user_id || null,
        action: data.action,
        target: data.target || null,
        target_id: data.target_id || null,
        description: data.description || null,
        ip_address: data.ip_address || '127.0.0.1',
      });
    } catch (e) {
      console.warn('DB audit log insert error:', e);
    }
  }
}

export async function getAuditLogs(): Promise<AuditLogData[]> {
  await initializeMemoryStore();
  return memoryStore.auditLogs;
}

export async function getAssetHistories(assetId?: number, actor?: UserSession | null): Promise<AssetHistoryData[]> {
  await initializeMemoryStore();
  let list = memoryStore.assetHistories;

  const scope = getDataScope(actor);
  if (scope.isScoped && scope.jurusanKode) {
    const allowedAssetIds = new Set(
      memoryStore.assets
        .filter((a) => a.jurusan_kode === scope.jurusanKode)
        .map((a) => a.id)
    );
    list = list.filter((h) => allowedAssetIds.has(h.asset_id));
  }

  if (assetId) {
    return list.filter((h) => h.asset_id === assetId);
  }
  return list;
}

// ----------------------------------------------------
// STATS & DASHBOARD AGGREGATION
// ----------------------------------------------------

export async function getInventoryStats(user?: UserSession | null): Promise<StatsData> {
  await initializeMemoryStore();

  let assetsList = [...memoryStore.assets];
  let borrowingsList = [...memoryStore.borrowings];
  let assetGroupsList = [...memoryStore.assetGroups];

  const scope = getDataScope(user);
  if (scope.isScoped && scope.jurusanKode) {
    assetsList = assetsList.filter((a) => a.jurusan_kode === scope.jurusanKode);
    borrowingsList = borrowingsList.filter((b) => b.jurusan_kode === scope.jurusanKode);
    assetGroupsList = assetGroupsList.filter((g) => g.jurusan_kode === scope.jurusanKode);
  }

  const totalBarang = assetGroupsList.length;
  const totalUnits = assetsList.length;

  let baikCount = 0;
  let rusakRinganCount = 0;
  let rusakBeratCount = 0;
  let baruCount = 0;
  let tersediaCount = 0;
  let dipinjamCount = 0;
  let perbaikanCount = 0;
  let totalNilai = 0;

  const kategoriCount: Record<string, number> = {};
  const jurusanCount: Record<string, number> = { RPL: 0, ATPH: 0, TBSM: 0 };
  const stokKritis: Array<{ id: number; kode: string; nama: string; kategori: string; jumlah: number }> = [];

  const now = new Date().getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  for (const a of assetsList) {
    if (a.kondisi === 'BAIK') baikCount++;
    else if (a.kondisi === 'RUSAK_RINGAN') rusakRinganCount++;
    else if (a.kondisi === 'RUSAK_BERAT') rusakBeratCount++;

    if (a.status === 'TERSEDIA') tersediaCount++;
    else if (a.status === 'DIPINJAM') dipinjamCount++;
    else if (a.status === 'PERBAIKAN') perbaikanCount++;

    if (a.harga_perolehan) totalNilai += Number(a.harga_perolehan);

    const createdTime = new Date(a.created_at).getTime();
    if (now - createdTime <= thirtyDaysMs) baruCount++;

    if (a.kategori) {
      kategoriCount[a.kategori] = (kategoriCount[a.kategori] || 0) + 1;
    }
    if (a.jurusan_kode) {
      jurusanCount[a.jurusan_kode] = (jurusanCount[a.jurusan_kode] || 0) + 1;
    }
  }

  // Stock alerts on asset groups where available units <= 2
  for (const ag of assetGroupsList) {
    const groupUnits = assetsList.filter((a) => a.asset_group_id === ag.id);
    const available = groupUnits.filter((a) => a.status === 'TERSEDIA').length;
    if (available <= 2 && groupUnits.length > 0) {
      stokKritis.push({
        id: ag.id,
        kode: ag.kode_kelompok,
        nama: ag.nama_barang,
        kategori: ag.jurusan_kode || 'Aset',
        jumlah: available,
      });
    }
  }

  const totalPengajuan = borrowingsList.length;
  const menungguPersetujuan = borrowingsList.filter((b) =>
    b.status.startsWith('MENUNGGU_PERSETUJUAN')
  ).length;
  const pengajuanDisetujui = borrowingsList.filter((b) =>
    b.status === 'DISETUJUI' || b.status === 'DIPINJAM' || b.status === 'DIKEMBALIKAN'
  ).length;
  const pengajuanDitolak = borrowingsList.filter((b) =>
    b.status.startsWith('DITOLAK')
  ).length;

  return {
    totalBarang: totalUnits,
    totalUnits,
    totalAset: totalUnits,
    barangBaik: baikCount,
    barangRusak: rusakRinganCount + rusakBeratCount,
    barangBaru: baruCount,
    tersedia: tersediaCount,
    dipinjam: dipinjamCount,
    perbaikan: perbaikanCount,
    totalPengajuan,
    menungguPersetujuan,
    pengajuanDisetujui,
    pengajuanDitolak,
    totalKategori: Object.keys(kategoriCount).length || 6,
    totalNilaiAset: totalNilai,
    stokKritis,
    kategoriCount,
    kondisiCount: {
      Baik: baikCount,
      RusakRingan: rusakRinganCount,
      RusakBerat: rusakBeratCount,
      Baru: baruCount,
    },
    jurusanCount,
  };
}

// ----------------------------------------------------
// LEGACY COMPATIBILITY HELPERS (MAP TO ASSETS)
// ----------------------------------------------------

export function mapAssetToLegacyBarang(a: AssetData): Barang {
  const parts = a.kode_barang.split('-');
  const groupCode = parts.length >= 4 ? `${parts[0]}-${parts[1]}-${parts[2]}` : a.kode_barang;

  return {
    id: a.id,
    kode: a.kode_barang,
    kode_unit: a.kode_barang,
    kode_kelompok: groupCode,
    nama: a.nama_barang || 'Barang',
    jumlah: 1,
    kondisi: a.kondisi === 'BAIK' ? 'Baik' : a.kondisi === 'RUSAK_RINGAN' ? 'Rusak Ringan' : 'Rusak Berat',
    status: a.status,
    jurusan: a.jurusan_kode,
    jurusan_nama: a.jurusan_nama,
    ruangan: a.ruangan_nama || undefined,
    ruangan_id: a.ruangan_id,
    merk: a.merk || undefined,
    tipe: a.tipe || undefined,
    nomor_seri: a.nomor_seri || undefined,
    nomor_unit: a.nomor_unit,
    tahun_perolehan: a.tahun_perolehan || undefined,
    sumber_dana: a.sumber_dana || undefined,
    harga_perolehan: a.harga_perolehan || undefined,
    keterangan: a.keterangan || undefined,
    created_at: a.created_at,
    updated_at: a.updated_at,
  };
}

export async function getLegacyBarangList(filters?: {
  kategori?: string;
  kondisi?: string;
  search?: string;
  sortBy?: string;
}): Promise<Barang[]> {
  const assets = await getAllAssets({
    kategoriName: filters?.kategori,
    kondisi: filters?.kondisi,
    search: filters?.search,
  });

  return assets.map(mapAssetToLegacyBarang);
}

export async function getLegacyBarangById(id: number): Promise<Barang | null> {
  const a = await getAssetById(id);
  return a ? mapAssetToLegacyBarang(a) : null;
}
