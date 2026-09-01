# Sistem Inventori dan Peminjaman Aset Sekolah

Aplikasi web modern berbasis **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**, dan **Drizzle ORM (Neon PostgreSQL)** untuk tata kelola inventaris, penomoran unit fisik aset, manajemen pengguna dengan Role-Based Access Control (RBAC 6 role), serta alur persetujuan peminjaman bertingkat pada lingkungan sekolah menengah kejuruan (SMK) dengan 3 jurusan: **RPL**, **ATPH**, dan **TBSM**.

---

## Daftar Isi
1. [Tentang Aplikasi](#tentang-aplikasi)
2. [Fitur Utama](#fitur-utama)
3. [Tech Stack](#tech-stack)
4. [Prasyarat Sistem](#prasyarat-sistem)
5. [Panduan Instalasi Lokal](#panduan-instalasi-lokal)
6. [Konfigurasi Environment](#konfigurasi-environment)
7. [Inisialisasi & Migrasi Database](#inisialisasi--migrasi-database)
8. [Daftar Akun Pengguna Default (Seed User)](#daftar-akun-pengguna-default-seed-user)
9. [Matriks Hak Akses & Role (RBAC)](#matriks-hak-akses--role-rbac)
10. [Aturan Pembatasan Data Berdasarkan Jurusan (Data Access Scope)](#aturan-pembatasan-data-berdasarkan-jurusan-data-access-scope)
11. [Alur & Siklus Hidup Peminjaman Aset](#alur--siklus-hidup-peminjaman-aset)
12. [Format Penomoran Kode Aset & Unit](#format-penomoran-kode-aset--unit)
13. [Struktur Database & Skema Relasional](#struktur-database--skema-relasional)
14. [Dokumentasi REST API](#dokumentasi-rest-api)
15. [Panduan Skenario Pengujian (Testing)](#panduan-skenario-pengujian-testing)
16. [Catatan Keamanan Produksi](#catatan-keamanan-produksi)

---

## 1. Tentang Aplikasi
Aplikasi ini dirancang untuk menjawab kebutuhan digitalisasi sarana dan prasarana sekolah secara presisi, akuntabel, dan transparan:
* **Penelusuran Unit Fisik Satuan**: Setiap unit barang memiliki nomor seri dan kode unit unik (misal: 10 laptop memiliki 10 kode unit fisik individual).
* **Multi-Jurusan Kejuruan**: Mendukung isolasi dan pengelolaan inventaris antar jurusan:
  - **RPL**: Rekayasa Perangkat Lunak (Lab Komputer, Server, Switch, Perangkat IT)
  - **ATPH**: Agribisnis Tanaman Pangan dan Hortikultura (Greenhouse, Traktor, Sensor Tanah, Sprayer)
  - **TBSM**: Teknik dan Bisnis Sepeda Motor (Bengkel Otomotif, Engine Stand, Toolset, Scanner EFI)
* **Persetujuan Bertingkat (Multi-Stage Approval)**: Memastikan peminjaman aset tercatat secara resmi dari tingkat laboratorium hingga otorisasi pimpinan sekolah.

---

## 2. Fitur Utama
* **Dashboard Analitik**: Monitoring total unit, stok siap pakai, unit sedang dipinjam, pengajuan menunggu review, dan breakdown per jurusan.
* **Katalog Aset & Unit**: Pencarian instan, filter kategori, filter kondisi fisik (`BAIK`, `RUSAK_RINGAN`, `RUSAK_BERAT`), dan filter jurusan.
* **Manajemen Peminjaman**: Pengajuan unit barang, verifikasi ketersediaan, serta pencatatan tanggal peminjaman & rencana pengembalian.
* **Alur Persetujuan 4 Tahap**: Otorisasi berjenjang yang aman dan dapat diverifikasi.
* **Serah Terima & Pengembalian Fisik**: Penguncian status unit saat dipinjam dan pemulihan status saat dikembalikan disertai evaluasi kondisi akhir barang.
* **Manajemen Pengguna & RBAC**: Tambah user, assign role, assign jurusan, aktivasi/deaktivasi akun, dan reset kata sandi.
* **Audit Trail & Log Mutasi**: Pencatatan riwayat setiap penambahan aset, perubahan status, persetujuan, dan pengembalian.

---

## 3. Tech Stack
| Lapisan | Teknologi |
|---|---|
| **Frontend & Backend** | Next.js 15 (App Router, Server Components & Route Handlers) |
| **Bahasa** | TypeScript 5 (Strict Type-Safety) |
| **Styling** | Tailwind CSS v4, Lucide React Icons |
| **Database ORM** | Drizzle ORM + Drizzle Kit |
| **Database Engine** | Neon Serverless PostgreSQL (dengan fallback in-memory dev store) |
| **Keamanan & Kriptografi** | `bcryptjs` untuk password hashing, HTTP-Only Cookie Session |

---

## 4. Prasyarat Sistem
* **Node.js**: Versi `18.18.0` atau yang lebih baru (disarankan Node.js 20 LTS)
* **Package Manager**: `npm` (atau `yarn` / `pnpm`)
* **Database**: Akun PostgreSQL atau [Neon Serverless Postgres](https://neon.tech) (opsional saat local dev karena sudah memiliki internal memory store)

---

## 5. Panduan Instalasi Lokal

1. **Clone repository atau ekstrak file project:**
   ```bash
   git clone <repo-url> inventaris-sekolah
   cd inventaris-sekolah
   ```

2. **Install dependensi project:**
   ```bash
   npm install
   ```

3. **Salin file konfigurasi environment:**
   ```bash
   cp .env.example .env
   ```

4. **Jalankan server pengembangan (development mode):**
   ```bash
   npm run dev
   ```

5. **Buka di browser:**
   Akses `http://localhost:3000` di peramban web Anda.

---

## 6. Konfigurasi Environment

Edit file `.env` di direktori utama:

```env
# Koneksi Database PostgreSQL / Neon
DATABASE_URL="postgresql://user:password@endpoint.region.aws.neon.tech/neondb?sslmode=require"

# Mode Lingkungan
NODE_ENV="development"

# Secret Key Sesi
SESSION_SECRET="kunci-rahasia-sesi-minimal-32-karakter-acak"

# App Metadata
NEXT_PUBLIC_APP_NAME="Sistem Inventori dan Peminjaman Aset Sekolah"
```

> **Catatan Pengembangan**: Jika `DATABASE_URL` tidak diisi atau database offline, aplikasi akan secara cerdas menjalankan **in-memory development database** yang sudah otomatis terisi dengan data awal (seed) 10 user, 3 jurusan, 9 kategori, dan belasan unit aset.

---

## 7. Inisialisasi & Migrasi Database

Untuk menerapkan skema database ke Neon PostgreSQL:

```bash
# Push skema tabel Drizzle ke instance database Neon/PostgreSQL
npx drizzle-kit push

# (Opsional) Buka GUI Drizzle Studio untuk inspeksi database
npx drizzle-kit studio
```

---

## 8. Daftar Akun Pengguna Default (Seed User)

Sistem menyediakan 10 akun bawaan untuk pengujian alur bisnis dan verifikasi hak akses seluruh role:

| No | Nama Lengkap | Username | Password (Dev) | Role | Jurusan |
|---|---|---|---|---|---|
| 1 | Administrator Utama | `superadmin` | `SuperAdmin123!` | `SUPER_ADMIN` | Global (Semua) |
| 2 | Operator Sarpras | `operator` | `Operator123!` | `OPERATOR` | Global (Semua) |
| 3 | Kepala Sekolah SMK | `kepsek` | `Kepsek123!` | `KEPALA_SEKOLAH` | Global (Semua) |
| 4 | Wakil Kepala Sarpras | `sarpras` | `Sarpras123!` | `WAKA_SARPRAS` | Global (Semua) |
| 5 | Ketua Kompetensi RPL | `kakom.rpl` | `KakomRPL123!` | `KAKOM` | **RPL** |
| 6 | Ketua Kompetensi ATPH | `kakom.atph` | `KakomATPH123!` | `KAKOM` | **ATPH** |
| 7 | Ketua Kompetensi TBSM | `kakom.tbsm` | `KakomTBSM123!` | `KAKOM` | **TBSM** |
| 8 | Laboran Lab Komputer RPL | `laboran.rpl` | `LaboranRPL123!` | `LABORAN` | **RPL** |
| 9 | Laboran Pertanian ATPH | `laboran.atph` | `LaboranATPH123!` | `LABORAN` | **ATPH** |
| 10 | Laboran Bengkel TBSM | `laboran.tbsm` | `LaboranTBSM123!` | `LABORAN` | **TBSM** |

> **PERINGATAN KEAMANAN**: Kredensial di atas **hanya diperuntukkan bagi lingkungan pengujian/development**. Pada deployment produksi nyata, seluruh kata sandi wajib diganti dengan kata sandi kuat melalui menu reset pengguna.

---

## 9. Matriks Hak Akses & Role (RBAC)

| Hak Akses / Kemampuan | `SUPER_ADMIN` | `OPERATOR` | `KEPALA_SEKOLAH` | `WAKA_SARPRAS` | `KAKOM` | `LABORAN` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Melihat Dashboard & Statistik** |  |  |  |  |  (Khusus Jurusan) |  (Khusus Jurusan) |
| **Melihat Katalog Aset & Stok** |  |  |  |  |  (Khusus Jurusan) |  (Khusus Jurusan) |
| **Tambah & Edit Aset / Unit** |  |  | ❌ | ❌ | ❌ |  (Khusus Jurusannya) |
| **Hapus Data Aset** |  | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Ajukan Peminjaman Barang** |  |  | ❌ | ❌ | ❌ |  (Khusus Jurusan) |
| **Approval Tahap 1 (Kakom)** |  | ❌ | ❌ | ❌ |  (Jurusannya) | ❌ |
| **Approval Tahap 2 (Sarpras)** |  | ❌ | ❌ |  | ❌ | ❌ |
| **Approval Tahap 3 (Kepsek)** |  | ❌ |  | ❌ | ❌ | ❌ |
| **Serah Terima Fisik (Mulai Pinjam)** |  |  | ❌ | ❌ | ❌ |  (Khusus Jurusan) |
| **Proses Pengembalian Barang** |  |  | ❌ | ❌ | ❌ |  (Khusus Jurusan) |
| **Manajemen Pengguna (User CRUD)** |  | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Melihat Audit Log Sistem** |  |  |  |  |  | ❌ |

---

## 10. Aturan Pembatasan Data Berdasarkan Jurusan (Data Access Scope)

Sistem menerapkan prinsip **Isolasi Data Berdasarkan Jurusan** di level server-side, API, dan query database:

> **Prinsip Utama**:
> * **ROLE**: Menentukan *apa yang boleh dilakukan* (kewenangan aksi / fitur / tombol).
> * **JURUSAN**: Menentukan *data mana yang boleh diakses* (lingkup aset, kelompok barang, histori, dan pengajuan).

### Matriks Cakupan Data (Data Scope Matrix)

| Role | Cakupan Data Inventori & Peminjaman | Jurusan yang Diakses |
|---|---|---|
| `SUPER_ADMIN` | **Semua Jurusan** | RPL, ATPH, TBSM |
| `OPERATOR` | **Semua Jurusan** | RPL, ATPH, TBSM |
| `KEPALA_SEKOLAH` | **Semua Jurusan** | RPL, ATPH, TBSM |
| `WAKA_SARPRAS` | **Semua Jurusan** | RPL, ATPH, TBSM |
| `KAKOM` | **Hanya Jurusannya** | Terkunci sesuai `authenticated_user.jurusan_id` |
| `LABORAN` | **Hanya Jurusannya** | Terkunci sesuai `authenticated_user.jurusan_id` |

### Ketentuan Teknis & Keamanan:
1. **Server-Authoritative Enforcement**: Backend tidak mempercayai parameter `jurusan_id` yang dikirim dari frontend. Lingkup akses murni ditentukan oleh data sesi otentikasi (`authenticated_user.jurusan_id` & `jurusan_kode`).
2. **Isolasi Query Database & Memory Store**: Setiap pemanggilan query daftar barang (`/api/barang`, `/api/assets`), detail barang, riwayat mutasi, pengajuan peminjaman (`/api/borrowings`), dan agregasi statistik (`/api/stats`) secara otomatis diinjeksi filter `WHERE jurusan_id = :userJurusanId` untuk role `KAKOM` dan `LABORAN`.
3. **Pencegahan Akses Antar Jurusan**:
   - Kakom RPL hanya dapat melihat kode `BRG-RPL-*`, dilarang melihat `BRG-ATPH-*` atau `BRG-TBSM-*`.
   - Laboran ATPH hanya dapat menambah atau mengajukan aset untuk jurusan ATPH.
   - Kakom hanya dapat menyetujui (`approve`) atau menolak (`reject`) permohonan peminjaman yang berasal dari jurusannya sendiri.

---

## 11. Alur & Siklus Hidup Peminjaman Aset

Proses peminjaman aset sekolah diatur melalui **4 Tahap Otorisasi Resmi**:

```text
[1. Pengajuan]       Laboran memilih unit aset & tanggal
       │
       ▼
[2. Tahap Kakom]     Status: MENUNGGU_PERSETUJUAN_KAKOM
       │             -> Kakom jurusan terkait melakukan Approval/Rejection
       ▼
[3. Tahap Sarpras]   Status: MENUNGGU_PERSETUJUAN_SARPRAS
       │             -> Waka Sarpras memverifikasi alokasi & menyetujui
       ▼
[4. Tahap Kepsek]    Status: MENUNGGU_PERSETUJUAN_KEPSEK
       │             -> Kepala Sekolah memberikan otorisasi final
       ▼
[5. Disetujui]       Status: DISETUJUI
       │             -> Barang siap diambil peminjam
       ▼
[6. Serah Terima]    Status: DIPINJAM
       │             -> Unit fisik aset terkunci dengan status "DIPINJAM"
       ▼
[7. Pengembalian]    Status: DIKEMBALIKAN
                     -> Petugas mengecek kondisi fisik, unit kembali "TERSEDIA"
```

*Jika pada salah satu tahap (Kakom / Sarpras / Kepsek) pengajuan ditolak, status berubah menjadi `DITOLAK` disertai alasan penolakan dan unit aset langsung dilepaskan.*

---

## 11. Format Penomoran Kode Aset & Unit

Sistem menerapkan penomoran terstruktur hierarkis:
1. **Kode Induk Kelompok Aset**: `BRG-{KODE_JURUSAN}-{URUT_BARANG}`
   - Contoh: `BRG-RPL-001` (Laptop ASUS ROG)
2. **Kode Unit Fisik Satuan**: `BRG-{KODE_JURUSAN}-{URUT_BARANG}-{URUT_UNIT}`
   - Contoh: `BRG-RPL-001-001`, `BRG-RPL-001-002`, `BRG-RPL-001-003`
3. **Nomor Peminjaman**: `PINJAM-{TAHUN}{BULAN}{HARI}-{URUT}`
   - Contoh: `PINJAM-20260301-001`

---

## 12. Struktur Database & Skema Relasional

1. **`jurusan`**: Master data jurusan (`RPL`, `ATPH`, `TBSM`).
2. **`categories`**: Master kategori aset (Komputer, Mesin, Elektronik, Laboratorium, Pertanian, Alat Berat).
3. **`rooms`**: Master ruangan penempatan aset (Lab RPL 1, Greenhouse, Bengkel Otomotif).
4. **`users`**: Data otentikasi, role, hashed password (`bcryptjs`), status aktif, dan jurusan.
5. **`asset_groups`**: Kelompok barang (nama barang, merk, tipe, spesifikasi).
6. **`assets`**: Unit fisik individual (kode unit, nomor seri, kondisi, status ketersediaan).
7. **`borrowings`**: Header transaksi peminjaman (nomor peminjaman, peminjam, jadwal, status workflow).
8. **`borrowing_items`**: Relasi unit aset yang dipinjam dalam satu nomor pengajuan.
9. **`approvals`**: Rekam jejak approval per tahap (user, role, status, catatan persetujuan).
10. **`asset_histories`**: Riwayat mutasi, perbaikan, perubahan status, dan peminjaman per unit aset.
11. **`audit_logs`**: Log audit jejak aktivitas sistem.
12. **`notifications`**: Notifikasi stok kritis dan aktivitas peminjaman.

---

## 13. Dokumentasi REST API

### Autentikasi
* `POST /api/auth/login` - Login pengguna (menerima `identifier` dan `password`).
* `POST /api/auth/logout` - Logout dan penghapusan sesi cookie.
* `GET /api/auth/me` - Mendapatkan informasi profil pengguna aktif.

### Manajemen Aset
* `GET /api/assets` - Daftar unit aset (query params: `jurusan`, `kategori`, `kondisi`, `status`, `search`).
* `POST /api/assets` - Tambah barang beserta generate unit fisik satuan.
* `GET /api/assets/:id` - Detail aset beserta riwayat mutasi.
* `PUT /api/assets/:id` - Memperbarui data aset & kondisi fisik.
* `DELETE /api/assets/:id` - Menghapus unit aset (Hanya Super Admin).

### Peminjaman & Workflow Approval
* `GET /api/borrowings` - Daftar pengajuan peminjaman (filter: `status`, `jurusan`).
* `POST /api/borrowings` - Buat pengajuan peminjaman baru (Role: Laboran / Super Admin).
* `GET /api/borrowings/:id` - Detail pengajuan dan riwayat persetujuan.
* `POST /api/borrowings/:id/approve` - Menyetujui pengajuan sesuai tahap role aktif.
* `POST /api/borrowings/:id/reject` - Menolak pengajuan dengan alasan penolakan.
* `POST /api/borrowings/:id/handover` - Serah terima barang fisik (ubah status jadi `DIPINJAM`).
* `POST /api/borrowings/:id/return` - Konfirmasi pengembalian barang dan pemulihan status unit.

### Manajemen Pengguna (Super Admin)
* `GET /api/users` - Daftar semua pengguna terdaftar.
* `POST /api/users` - Pendaftaran pengguna baru dan penugasan role.
* `PATCH /api/users/:id/status` - Toggle status aktif / nonaktif pengguna.
* `POST /api/users/:id/reset-password` - Reset kata sandi pengguna.

### Master Data & Audit
* `GET /api/jurusan` - Daftar jurusan sekolah.
* `GET /api/rooms` - Daftar ruangan sekolah.
* `GET /api/categories` - Daftar kategori inventaris.
* `GET /api/audit-logs` - Log jejak audit transaksi sistem.
* `GET /api/stats` - Statistik ringkasan inventaris untuk dashboard.

---

## 14. Panduan Skenario Pengujian (Testing)

### Skenario 1: Verifikasi Enforce Permission Backend (Security Check)
* **Uji**: Login sebagai `laboran.rpl` lalu lakukan request manual `POST /api/borrowings/1/approve`.
* **Hasil Diharapkan**: Response **`403 Forbidden`** dengan pesan penolakan wewenang: *"Role LABORAN tidak memiliki kewenangan approval."*

### Skenario 2: Isolasi Kewenangan Jurusan (Kakom Check)
* **Uji**: Login sebagai `kakom.atph` lalu coba menyetujui pengajuan peminjaman milik aset jurusan `RPL`.
* **Hasil Diharapkan**: Response **`403 Forbidden`** dengan pesan penolakan: *"Kakom hanya berhak menyetujui pengajuan pada jurusannya sendiri (ATPH)."*

### Skenario 3: Alur Penuh Peminjaman hingga Selesai
1. Login sebagai `laboran.rpl` -> Buka menu **Peminjaman** -> Klik **Ajukan Peminjaman** -> Pilih unit laptop RPL -> Submit.
2. Login sebagai `kakom.rpl` -> Buka menu **Peminjaman** -> Klik **Setujui (KAKOM)**.
3. Login sebagai `sarpras` -> Buka menu **Peminjaman** -> Klik **Setujui (WAKA_SARPRAS)**.
4. Login sebagai `kepsek` -> Buka menu **Peminjaman** -> Klik **Setujui (KEPALA_SEKOLAH)** (Status menjadi `DISETUJUI`).
5. Login sebagai `laboran.rpl` atau `operator` -> Klik **Serah Terima Barang** (Status menjadi `DIPINJAM`, aset terkunci).
6. Saat masa pinjam selesai, klik **Konfirmasi Pengembalian** (Status menjadi `DIKEMBALIKAN`, aset kembali `TERSEDIA`).

---

## 15. Catatan Keamanan Produksi
1. Seluruh password di hash menggunakan algoritma **bcryptjs dengan salt rounds 10**.
2. Cookie sesi menggunakan flag **HttpOnly**, **SameSite=Lax**, dan **Secure** saat di lingkungan HTTPS.
3. Selalu perbarui `SESSION_SECRET` dengan string acak panjang sebelum aplikasi di publikasikan ke server produksi.
4. Lakukan backup berkala database PostgreSQL secara terjadwal.

---

**Sistem Inventori dan Peminjaman Aset Sekolah**  
*Mewujudkan Tata Kelola Sarana & Prasarana Sekolah yang Tertib, Transparan, dan Modern.*
