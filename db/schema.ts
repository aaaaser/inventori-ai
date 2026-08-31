import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  numeric,
  date,
} from 'drizzle-orm/pg-core';

// 1. Jurusan
export const jurusan = pgTable('jurusan', {
  id: serial('id').primaryKey(),
  kode: varchar('kode', { length: 20 }).notNull().unique(), // RPL, ATPH, TBSM
  nama: varchar('nama', { length: 255 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Rooms
export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  jurusan_id: integer('jurusan_id').references(() => jurusan.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Users (RBAC 6 Roles)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // SUPER_ADMIN, KEPALA_SEKOLAH, OPERATOR, WAKA_SARPRAS, KAKOM, LABORAN
  jurusan_id: integer('jurusan_id').references(() => jurusan.id, { onDelete: 'set null' }),
  is_active: boolean('is_active').default(true).notNull(),
  last_login: timestamp('last_login', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Asset Groups (Kelompok Barang: e.g. BRG-RPL-001)
export const assetGroups = pgTable('asset_groups', {
  id: serial('id').primaryKey(),
  kode_kelompok: varchar('kode_kelompok', { length: 50 }).notNull().unique(),
  nama_barang: varchar('nama_barang', { length: 255 }).notNull(),
  jurusan_id: integer('jurusan_id')
    .notNull()
    .references(() => jurusan.id, { onDelete: 'restrict' }),
  kategori_id: integer('kategori_id').references(() => categories.id, { onDelete: 'set null' }),
  merk: varchar('merk', { length: 100 }),
  tipe: varchar('tipe', { length: 100 }),
  satuan: varchar('satuan', { length: 50 }).default('Unit'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Assets (Unit Fisik Barang: e.g. BRG-RPL-001-001)
export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  asset_group_id: integer('asset_group_id')
    .notNull()
    .references(() => assetGroups.id, { onDelete: 'cascade' }),
  kode_barang: varchar('kode_barang', { length: 50 }).notNull().unique(),
  nomor_unit: integer('nomor_unit').notNull(),
  nomor_seri: varchar('nomor_seri', { length: 100 }),
  ruangan_id: integer('ruangan_id').references(() => rooms.id, { onDelete: 'set null' }),
  kondisi: varchar('kondisi', { length: 50 }).default('BAIK').notNull(), // BAIK, RUSAK_RINGAN, RUSAK_BERAT
  status: varchar('status', { length: 50 }).default('TERSEDIA').notNull(), // TERSEDIA, DIPINJAM, PERBAIKAN, RUSAK, TIDAK_AKTIF
  tahun_perolehan: integer('tahun_perolehan'),
  sumber_dana: varchar('sumber_dana', { length: 100 }),
  harga_perolehan: numeric('harga_perolehan', { precision: 15, scale: 2 }),
  foto: text('foto'),
  keterangan: text('keterangan'),
  created_by: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  updated_by: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. Borrowings (Pengajuan Peminjaman)
export const borrowings = pgTable('borrowings', {
  id: serial('id').primaryKey(),
  nomor_pengajuan: varchar('nomor_pengajuan', { length: 50 }).notNull().unique(), // REQ-YYYYMMDD-XXXX
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  jurusan_id: integer('jurusan_id')
    .notNull()
    .references(() => jurusan.id, { onDelete: 'restrict' }),
  tanggal_pengajuan: timestamp('tanggal_pengajuan', { withTimezone: true }).defaultNow().notNull(),
  tanggal_peminjaman: date('tanggal_peminjaman').notNull(),
  tanggal_pengembalian_rencana: date('tanggal_pengembalian_rencana').notNull(),
  tanggal_pengembalian_realisasi: date('tanggal_pengembalian_realisasi'),
  tujuan: varchar('tujuan', { length: 255 }).notNull(),
  keperluan: text('keperluan').notNull(),
  status: varchar('status', { length: 50 }).default('MENUNGGU_PERSETUJUAN_KAKOM').notNull(),
  // DRAFT, MENUNGGU_PERSETUJUAN_KAKOM, DITOLAK_KAKOM, MENUNGGU_PERSETUJUAN_SARPRAS, DITOLAK_SARPRAS, MENUNGGU_PERSETUJUAN_KEPALA_SEKOLAH, DITOLAK_KEPALA_SEKOLAH, DISETUJUI, DIPINJAM, DIKEMBALIKAN, DIBATALKAN
  catatan: text('catatan'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 8. Borrowing Items (Item Unit yang Dipinjam)
export const borrowingItems = pgTable('borrowing_items', {
  id: serial('id').primaryKey(),
  borrowing_id: integer('borrowing_id')
    .notNull()
    .references(() => borrowings.id, { onDelete: 'cascade' }),
  asset_id: integer('asset_id')
    .notNull()
    .references(() => assets.id, { onDelete: 'restrict' }),
  kondisi_sebelum: varchar('kondisi_sebelum', { length: 50 }).default('BAIK'),
  kondisi_sesudah: varchar('kondisi_sesudah', { length: 50 }),
  catatan: text('catatan'),
});

// 9. Approvals (Riwayat Persetujuan Workflow)
export const approvals = pgTable('approvals', {
  id: serial('id').primaryKey(),
  borrowing_id: integer('borrowing_id')
    .notNull()
    .references(() => borrowings.id, { onDelete: 'cascade' }),
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  role: varchar('role', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // APPROVED, REJECTED, OVERRIDDEN
  catatan: text('catatan'),
  approved_at: timestamp('approved_at', { withTimezone: true }).defaultNow().notNull(),
});

// 10. Asset Histories (Audit & Mutasi Riwayat Aset)
export const assetHistories = pgTable('asset_histories', {
  id: serial('id').primaryKey(),
  asset_id: integer('asset_id')
    .notNull()
    .references(() => assets.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(), // CREATED, STATUS_CHANGED, KONDISI_CHANGED, LOCATION_CHANGED, BORROWED, RETURNED
  old_value: text('old_value'),
  new_value: text('new_value'),
  description: text('description'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 11. Audit Logs (Log Aktivitas Sistem)
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  target: varchar('target', { length: 100 }),
  target_id: varchar('target_id', { length: 100 }),
  description: text('description'),
  ip_address: varchar('50'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 12. Notifications (Sistem Notifikasi)
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 100 }).default('all').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Legacy backward-compatibility table for existing simple CRUD views
export const barang = pgTable('barang', {
  id: serial('id').primaryKey(),
  kode: varchar('kode', { length: 100 }).notNull().unique(),
  nama: varchar('nama', { length: 255 }).notNull(),
  kategori: varchar('kategori', { length: 100 }).notNull(),
  jumlah: integer('jumlah').default(0).notNull(),
  kondisi: varchar('kondisi', { length: 50 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type inference
export type Jurusan = typeof jurusan.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type User = typeof users.$inferSelect;
export type AssetGroup = typeof assetGroups.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Borrowing = typeof borrowings.$inferSelect;
export type BorrowingItem = typeof borrowingItems.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type AssetHistory = typeof assetHistories.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AppNotification = typeof notifications.$inferSelect;
export type BarangSelect = typeof barang.$inferSelect;
export type BarangInsert = typeof barang.$inferInsert;
