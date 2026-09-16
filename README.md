# Sistem Inventori dan Peminjaman Aset Sekolah

Aplikasi web modern berbasis **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**, dan **Drizzle ORM (Neon PostgreSQL)** untuk tata kelola inventaris, penomoran unit fisik aset, sistem QR code, riwayat pemeliharaan/perawatan (*maintenance*), manajemen pengguna dengan Role-Based Access Control (RBAC 6 role), serta alur persetujuan peminjaman bertingkat pada lingkungan sekolah menengah kejuruan (SMK) dengan 3 jurusan: **RPL**, **ATPH**, dan **TBSM**.

---

## Daftar Isi
1. [Tentang Aplikasi](#tentang-aplikasi)
2. [Hierarki Kode Barang & Hubungan Data](#hierarki-kode-barang--hubungan-data)
3. [Aturan Pembuatan & Integritas Kode Unit](#aturan-pembuatan--integritas-kode-unit)
4. [Sistem QR Code & Cetak Label Aset](#sistem-qr-code--cetak-label-aset)
5. [Sistem Manajemen Perawatan & Pemeliharaan (Maintenance)](#sistem-manajemen-perawatan--pemeliharaan-maintenance)
6. [Fitur Utama](#fitur-utama)
7. [Tech Stack](#tech-stack)
8. [Prasyarat Sistem](#prasyarat-sistem)
9. [Panduan Instalasi Lokal](#panduan-instalasi-lokal)
10. [Konfigurasi Environment](#konfigurasi-environment)
11. [Inisialisasi & Migrasi Database](#inisialisasi--migrasi-database)
12. [Daftar Akun Pengguna Default (Seed User)](#daftar-akun-pengguna-default-seed-user)
13. [Matriks Hak Akses & Role (RBAC)](#matriks-hak-akses--role-rbac)
14. [Aturan Pembatasan Data Berdasarkan Jurusan (Data Access Scope)](#aturan-pembatasan-data-berdasarkan-jurusan-data-access-scope)
15. [Alur & Siklus Hidup Peminjaman Aset](#alur--siklus-hidup-peminjaman-aset)
16. [Struktur Database & Skema Relasional](#struktur-database--skema-relasional)
17. [Dokumentasi REST API Lengkap](#dokumentasi-rest-api-lengkap)
18. [Panduan Skenario Pengujian (Testing)](#panduan-skenario-pengujian-testing)
19. [Catatan Keamanan Produksi](#catatan-keamanan-produksi)

---

## 1. Tentang Aplikasi
Aplikasi ini dirancang untuk menjawab kebutuhan digitalisasi sarana dan prasarana sekolah secara presisi, akuntabel, dan transparan:
* **Penelusuran Unit Fisik Satuan**: Setiap unit barang memiliki nomor seri dan kode unit unik (misal: 10 laptop memiliki 10 kode unit fisik individual).
* **Multi-Jurusan Kejuruan**: Mendukung isolasi dan pengelolaan inventaris antar jurusan:
  - **RPL**: Rekayasa Perangkat Lunak (Lab Komputer, Server, Switch, Perangkat IT)
  - **ATPH**: Agribisnis Tanaman Pangan dan Hortikultura (Greenhouse, Traktor, Sensor Tanah, Sprayer)
  - **TBSM**: Teknik dan Bisnis Sepeda Motor (Bengkel Otomotif, Engine Stand, Toolset, Scanner EFI)
* **Persetujuan Bertingkat (Multi-Stage Approval)**: Memastikan peminjaman aset tercatat secara resmi dari tingkat laboratorium hingga otorisasi pimpinan sekolah.
* **Integrasi QR Code & Perawatan Unit**: Menghubungkan setiap unit barang dengan QR code individual dan rekam jejak pemeliharaan berkala.

---

## 2. Hierarki Kode Barang & Hubungan Data

Sistem menerapkan pemisahan yang tegas antara **Kelompok/Jenis Barang** dan **Unit Fisik Barang**:

```text
[Jenis Barang] (Asset Group)
     │   BRG-RPL-001 = Komputer Server
     │
     ▼
[Unit Fisik Barang] (Assets)
     ├── BRG-RPL-001-001 = Server Unit 1 ──► [QR Code] ──► [Detail Aset] ──► [Riwayat Perawatan]
     ├── BRG-RPL-001-002 = Server Unit 2 ──► [QR Code] ──► [Detail Aset] ──► [Riwayat Perawatan]
     └── BRG-RPL-001-003 = Server Unit 3 ──► [QR Code] ──► [Detail Aset] ──► [Riwayat Perawatan]
```

### Contoh Kelompok & Unit Berdasarkan Jurusan:

#### Jurusan RPL (Rekayasa Perangkat Lunak)
* `BRG-RPL-001`: Komputer Server
  * `BRG-RPL-001-001`
  * `BRG-RPL-001-002`
* `BRG-RPL-002`: Switch Hub 24 Port
  * `BRG-RPL-002-001`
  * `BRG-RPL-002-002`
* `BRG-RPL-003`: Router Mikrotik
  * `BRG-RPL-003-001`
  * `BRG-RPL-003-002`

#### Jurusan ATPH (Agribisnis Tanaman Pangan & Hortikultura)
* `BRG-ATPH-001`: Traktor Tangan
  * `BRG-ATPH-001-001`
  * `BRG-ATPH-001-002`
* `BRG-ATPH-002`: Sprayer Elektrik
  * `BRG-ATPH-002-001`
  * `BRG-ATPH-002-002`
* `BRG-ATPH-003`: pH Meter Tanah
  * `BRG-ATPH-003-001`
  * `BRG-ATPH-003-002`

#### Jurusan TBSM (Teknik & Bisnis Sepeda Motor)
* `BRG-TBSM-001`: Toolset Mekanik
  * `BRG-TBSM-001-001`
  * `BRG-TBSM-001-002`
* `BRG-TBSM-002`: Kompresor Udara
  * `BRG-TBSM-002-001`
  * `BRG-TBSM-002-002`
* `BRG-TBSM-003`: Engine Stand Motor
  * `BRG-TBSM-003-001`
  * `BRG-TBSM-003-002`

---

## 3. Aturan Pembuatan & Integritas Kode Unit

Sistem memberlakukan aturan validasi dan generator kode otomatis pada backend service (`lib/school-inventory-service.ts`):

1. **Format Wajib**: Kode unit **harus selalu** berasal dari: `kode jenis barang` + `nomor unit` (misal: `BRG-RPL-001-001`).
2. **Larangan Pola Manual**: Sistem **tidak boleh dan tidak akan** membuat kode berdasarkan nama barang, merk, nomor seri acak, atau nama ruangan.
3. **Keunikan Global (*Unique Constraint*)**: Setiap nomor unit bersifat unik di seluruh database.
4. **Prinsip Non-Reusability**: Jika suatu unit barang dihapus (*soft-delete* / tercatat di riwayat mutasi / audit log), nomor unit tersebut **tidak akan digunakan ulang** untuk unit baru demi menjaga integritas data riwayat.
5. **Perubahan Status Real-Time**: Status unit fisik diperbarui secara otomatis berdasarkan aktivitas:
   - Pengajuan peminjaman diserahkan ➔ status menjadi `DIPINJAM`.
   - Pemeliharaan dimulai ➔ status menjadi `PERAWATAN` / `PERBAIKAN`.
   - Pemeliharaan atau pengembalian selesai ➔ status pulih menjadi `TERSEDIA`.

---

## 4. Sistem QR Code, Scanner Kamera & Cetak Label Aset

Setiap unit barang memiliki QR code mandiri yang siap dicetak untuk pelabelan fisik serta dipindai menggunakan scanner kamera bawaan perangkat:

### 1. Fitur Scanner QR Code Kamera (Dashboard & Data Barang)
* **Akses Cepat**: Tombol `[ 📷 Scan QR Barang ]` tersedia di halaman awal/dashboard dan halaman Data Barang.
* **Kompatibilitas Perangkat**:
  - **Smartphone / Tablet**: Otomatis memprioritaskan kamera belakang (`facingMode: "environment"`) dan mendukung toggle flash/torch jika didukung perangkat.
  - **Laptop / Desktop**: Menggunakan webcam perangkat.
  - **Fallback Input Manual**: Jika perangkat tidak memiliki kamera atau izin browser tidak diaktifkan, pengguna dapat beralih ke tab input kode manual tanpa keluar dari modal.
* **Mekanisme Anti-Duplicate / Locking**:
  - Ketika QR Code terbaca, stream kamera langsung dijeda/dihentikan dan flag penguncian (*debounce lock*) aktif untuk mencegah pembacaan ganda atau navigasi berulang.
  - Sistem menampilkan umpan balik visual (*loading feedback*): `"QR Code berhasil dibaca. Membuka detail barang..."` kemudian mengarahkan ke halaman detail unit.
* **Penanganan Error & Validasi**:
  - **QR Tidak Terdaftar**: Menampilkan pesan `"Barang tidak ditemukan. QR Code tidak terdaftar pada sistem"` dan tombol `"Scan Ulang"`.
  - **Akses Antar Jurusan (RBAC)**: Jika pengguna login dengan role terbatas (misal Laboran RPL) memindai QR aset jurusan lain (misal ATPH), backend secara otomatis menolak dengan status HTTP 403 Forbidden dan notifikasi yang jelas.

---

### 2. Panduan Menjalankan Scanner di Local Development (Kamera & Browser Permissions)

Akses kamera peramban web diatur secara ketat oleh standar keamanan W3C (*Secure Context / MediaDevices API*):

1. **Pengembangan di Localhost**:
   - Browser modern (Google Chrome, Firefox, Microsoft Edge, Safari) mengizinkan akses kamera langsung pada origin `http://localhost:3000` atau `http://127.0.0.1:3000` tanpa memerlukan sertifikat SSL/HTTPS.
2. **Pengujian pada Jaringan Lokal (IP LAN / Wi-Fi Smartphone)**:
   - Jika Anda membuka aplikasi dari smartphone menggunakan IP komputer (contoh: `http://192.168.1.15:3000`), browser **akan memblokir akses kamera** karena dianggap sebagai koneksi tidak aman (*insecure context*).
   - **Solusi untuk testing di smartphone melalui LAN**:
     - Gunakan tunneling HTTPS seperti `ngrok` (`ngrok http 3000`) atau Cloudflare Tunnel.
     - Atau gunakan fitur flag Chrome di smartphone: Buka `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, tambahkan `http://192.168.1.15:3000`, lalu aktifkan (*Enable*).
3. **Pengaturan Izin Kamera di Browser**:
   - Jika muncul pesan `"Kamera tidak dapat digunakan. Silakan izinkan akses kamera pada browser kemudian coba kembali"`, klik ikon gembok / perizinan situs pada address bar browser, lalu ubah status **Kamera** menjadi **Izinkan (Allow)**.

---

### 3. Target URL QR Code & Cetak Label
1. **Target Format QR Code**: QR Code merujuk ke kode unit spesifik atau URL detail unit:
   ```text
   BRG-RPL-001-001  atau  https://domain-sekolah.sch.id/barang/1
   ```
2. **Keamanan QR Code (Security Enforcement)**:
   - Pemindaian QR Code menampilkan data publik yang aman (nama barang, kode unit, jurusan, ruangan, kondisi fisik, dan status ketersediaan).
   - QR Code **bukan mekanisme bypass otorisasi**.
   - Aksi pengeditan aset, pembuatan pemeliharaan, atau persetujuan peminjaman tetap wajib melalui otentikasi login dengan role yang sesuai.
3. **Endpoint API**:
   - `POST /api/assets/scan` - Validasi payload QR dan otorisasi akses jurusan.
   - `GET /api/qr-code?url=...&format=svg` (vektor tajam untuk cetak)
   - `GET /api/qr-code?url=...&format=png` (gambar raster)
4. **Fitur Print QR Code**: Halaman detail aset (`/barang/[id]`) menyediakan tombol **Cetak QR Code** dengan template label siap tempel yang memuat logo sekolah, nama barang, kode unit, dan petunjuk scan.

---

## 5. Sistem Manajemen Perawatan & Pemeliharaan (Maintenance)

Modul perawatan aset (`/api/maintenances`) mencatat seluruh riwayat pemeliharaan preventif maupun perbaikan kuratif per unit aset:

* **Field Data Perawatan**:
  - `id`: ID unik rekam perawatan
  - `asset_id`: Referensi unit barang terkait
  - `tanggal_perawatan`: Tanggal pelaksanaan
  - `jenis_perawatan`: `RUTIN`, `PERBAIKAN`, `PENGGANTIAN_SPAREPART`, `KALIBRASI`
  - `deskripsi`: Catatan detail tindakan perbaikan
  - `biaya`: Estimasi / realisasi biaya perbaikan (Rp)
  - `pelaksana`: Nama teknisi internal atau vendor eksternal
  - `status`: `DIJADWALKAN`, `PROSES`, `SELESAI`, `DIBATALKAN`
  - `catatan_kondisi`: Evaluasi kondisi unit setelah tindakan (`BAIK`, `RUSAK_RINGAN`, dll.)
* **Otomatisasi Status Unit**:
  - Saat rekam perawatan baru dengan status `PROSES` dibuat, unit aset otomatis diset ke status `PERAWATAN`.
  - Saat status perawatan diperbarui menjadi `SELESAI`, status unit otomatis kembali ke `TERSEDIA` dan kondisi fisiknya diperbarui sesuai `catatan_kondisi`.

---

## 6. Fitur Utama
* **Dashboard Analitik**: Monitoring total unit, stok siap pakai, unit sedang dipinjam, pengajuan menunggu review, dan breakdown per jurusan.
* **Katalog Aset & Unit**: Pencarian instan, filter kategori, filter kondisi fisik (`BAIK`, `RUSAK_RINGAN`, `RUSAK_BERAT`), dan filter jurusan.
* **Manajemen Peminjaman**: Pengajuan unit barang, verifikasi ketersediaan, serta pencatatan tanggal peminjaman & rencana pengembalian.
* **Alur Persetujuan 4 Tahap**: Otorisasi berjenjang yang aman dan dapat diverifikasi.
* **Serah Terima & Pengembalian Fisik**: Penguncian status unit saat dipinjam dan pemulihan status saat dikembalikan disertai evaluasi kondisi akhir barang.
* **Manajemen Pengguna & RBAC**: Tambah user, assign role, assign jurusan, aktivasi/deaktivasi akun, dan reset kata sandi.
* **Audit Trail & Log Mutasi**: Pencatatan riwayat setiap penambahan aset, perubahan status, persetujuan, dan pengembalian.

---

## 7. Tech Stack
| Lapisan | Teknologi |
|---|---|
| **Frontend & Backend** | Next.js 15 (App Router, Server Components & Route Handlers) |
| **Bahasa** | TypeScript 5 (Strict Type-Safety) |
| **Styling** | Tailwind CSS v4, Lucide React Icons |
| **Database ORM** | Drizzle ORM + Drizzle Kit |
| **Database Engine** | Neon Serverless PostgreSQL (dengan fallback in-memory dev store) |
| **QR Engine** | `qrcode` Server-side renderer |
| **Keamanan & Kriptografi** | `bcryptjs` untuk password hashing, HTTP-Only Cookie Session |

---

## 8. Prasyarat Sistem
* **Node.js**: Versi `18.18.0` atau yang lebih baru (disarankan Node.js 20 LTS)
* **Package Manager**: `npm` (atau `yarn` / `pnpm`)
* **Database**: Akun PostgreSQL atau [Neon Serverless Postgres](https://neon.tech) (opsional saat local dev karena sudah memiliki internal memory store)

---

## 9. Panduan Instalasi Lokal

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

## 10. Konfigurasi Environment

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

## 11. Inisialisasi & Migrasi Database

Untuk menerapkan skema database ke Neon PostgreSQL:

```bash
# Push skema tabel Drizzle ke instance database Neon/PostgreSQL
npx drizzle-kit push

# (Opsional) Buka GUI Drizzle Studio untuk inspeksi database
npx drizzle-kit studio
```

---

## 12. Daftar Akun Pengguna Default (Seed User)

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

## 13. Matriks Hak Akses & Role (RBAC)

| Hak Akses / Kemampuan | `SUPER_ADMIN` | `OPERATOR` | `KEPALA_SEKOLAH` | `WAKA_SARPRAS` | `KAKOM` | `LABORAN` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Melihat Dashboard & Statistik** |  |  |  |  |  (Khusus Jurusan) |  (Khusus Jurusan) |
| **Melihat Katalog Aset & Stok** |  |  |  |  |  (Khusus Jurusan) |  (Khusus Jurusan) |
| **Tambah & Edit Aset / Unit** |  |  | ❌ | ❌ | ❌ |  (Khusus Jurusannya) |
| **Kelola Perawatan / Maintenance** |  |  | ❌ | ❌ | ❌ |  (Khusus Jurusan) |
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

## 14. Aturan Pembatasan Data Berdasarkan Jurusan (Data Access Scope)

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

## 15. Alur & Siklus Hidup Peminjaman Aset

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

## 16. Struktur Database & Skema Relasional

1. **`jurusan`**: Master data jurusan (`RPL`, `ATPH`, `TBSM`).
2. **`rooms`**: Master data ruangan dinamis penempatan aset (Lab RPL 1, Lab RPL 2, Server Room, Greenhouse 1, Bengkel Mesin, Ruang Teori, dll.) dengan relasi ke `jurusan_id`.
3. **`users`**: Data otentikasi, role, hashed password (`bcryptjs`), status aktif, dan jurusan.
4. **`asset_groups`**: Kelompok / jenis barang (kode kelompok `BRG-[JURUSAN]-XXX`, nama barang, merk, tipe, spesifikasi).
5. **`assets`**: Unit fisik individual (kode unit `BRG-[JURUSAN]-XXX-YYY`, nomor seri, kondisi, status ketersediaan, relasi ke `ruangan_id`, `asset_group_id`, dan `jurusan_id`).
6. **`asset_maintenances`**: Riwayat perawatan, perbaikan, teknisi, biaya, dan hasil kondisi fisik.
7. **`borrowings`**: Header transaksi peminjaman (nomor peminjaman, peminjam, jadwal, status workflow).
8. **`borrowing_items`**: Relasi unit aset yang dipinjam dalam satu nomor pengajuan.
9. **`approvals`**: Rekam jejak approval per tahap (user, role, status, catatan persetujuan).
10. **`asset_histories`**: Riwayat mutasi, perbaikan, perubahan status, dan peminjaman per unit aset.
11. **`audit_logs`**: Log audit jejak aktivitas sistem.
12. **`notifications`**: Notifikasi stok kritis dan aktivitas peminjaman.

---

## 17. Dokumentasi REST API Lengkap

### Autentikasi
* `POST /api/auth/login` - Login pengguna (menerima `identifier` dan `password`).
* `POST /api/auth/logout` - Logout dan penghapusan sesi cookie.
* `GET /api/auth/me` - Mendapatkan informasi profil pengguna aktif.

### Manajemen Kelompok Aset (Asset Groups)
* `GET /api/asset-groups` - Daftar kelompok barang dan unit di dalamnya (query: `jurusan`, `search`, `nextCodeFor`).
* `POST /api/asset-groups` - Tambah kelompok jenis barang baru beserta unit pertamanya.

### Manajemen Unit Aset & QR
* `GET /api/assets` - Daftar unit aset (query params: `jurusan`, `ruangan_id`, `kondisi`, `status`, `search`).
* `POST /api/assets` - Tambah barang beserta batch generate unit fisik satuan.
* `GET /api/assets/:id` - Detail unit aset lengkap beserta riwayat pemeliharaan, riwayat peminjaman, dan log mutasi.
* `PUT /api/assets/:id` - Memperbarui data spesifikasi aset & kondisi fisik.
* `DELETE /api/assets/:id` - Menghapus unit aset (Hanya Super Admin & Laboran sesuai hak jurusan).
* `GET /api/qr-code` - Generate kode QR dinamis (query: `url`, `format=svg|png`, `width`).

### Manajemen Ruangan Dinamis (Rooms Master)
* `GET /api/rooms` - Daftar semua ruangan (filter query: `jurusan_id`, `active_only`, `search`).
* `POST /api/rooms` - Tambah ruangan baru (Role: Super Admin / Operator / Laboran).
* `GET /api/rooms/:id` - Detail data ruangan beserta aset yang ditempatkan di dalamnya.
* `PUT /api/rooms/:id` - Update nama, kode, lokasi, dan status ruangan.
* `DELETE /api/rooms/:id` - Hapus ruangan (dengan proteksi integritas: ruangan yang masih memiliki aset aktif tidak dapat dihapus).

### Riwayat Perawatan (Maintenance)
* `GET /api/maintenances` - Daftar log perawatan aset (filter: `assetId`, `jurusan`).
* `POST /api/maintenances` - Buat rekam perawatan/perbaikan baru (otomatis sinkron status unit).
* `GET /api/maintenances/:id` - Detail data perawatan.
* `PUT /api/maintenances/:id` - Perbarui status perawatan & kondisi akhir aset.
* `DELETE /api/maintenances/:id` - Hapus data perawatan.

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
* `GET /api/rooms` - Daftar ruangan sekolah dinamis.
* `GET /api/audit-logs` - Log jejak audit transaksi sistem.
* `GET /api/stats` - Statistik agregat unit aset & status peminjaman untuk dashboard.

---

## 18. Panduan Skenario Pengujian (Testing)

### Skenario 1: Verifikasi Generator Kode Unit & Non-Reusability
1. Buka form **Tambah Barang** -> Pilih Jurusan `RPL`, Nama: `Komputer Server`, Jumlah: `3`.
2. Sistem secara otomatis membuat unit `BRG-RPL-001-001`, `BRG-RPL-001-002`, `BRG-RPL-001-003`.
3. Hapus salah satu unit, lalu daftarkan unit tambahan berikutnya.
4. Sistem tidak akan menggunakan ulang nomor yang pernah ada, melainkan melanjutkan ke nomor unit berikutnya (`BRG-RPL-001-004`).

### Skenario 2: Verifikasi Alur Perawatan (Maintenance Workflow)
1. Buka halaman detail unit `BRG-RPL-001-001` (`/barang/1`).
2. Klik tombol **Catat Perawatan / Perbaikan**.
3. Isi jenis perawatan `PERBAIKAN`, status `PROSES`. Simpan.
4. Unit aset otomatis berubah status menjadi `PERAWATAN`.
5. Klik **Selesaikan Perbaikan** -> status unit otomatis pulih menjadi `TERSEDIA`.

### Skenario 3: Verifikasi QR Code & Keamanan
1. Buka halaman detail unit `BRG-RPL-001-001`.
2. Klik **Cetak QR Code** -> Jendela cetak browser akan terbuka dengan template label aset yang siap dipotong dan ditempel pada perangkat fisik.
3. Akses URL QR Code `/inventori/barang/detail/1` tanpa login. Sistem hanya menampilkan ringkasan publik tanpa mengizinkan manipulasi data.

---

## 19. Catatan Keamanan Produksi
1. Seluruh password di hash menggunakan algoritma **bcryptjs dengan salt rounds 10**.
2. Cookie sesi menggunakan flag **HttpOnly**, **SameSite=Lax**, dan **Secure** saat di lingkungan HTTPS.
3. Selalu perbarui `SESSION_SECRET` dengan string acak panjang sebelum aplikasi di publikasikan ke server produksi.
4. Lakukan backup berkala database PostgreSQL secara terjadwal.

---

**Sistem Inventori dan Peminjaman Aset Sekolah**  
*Mewujudkan Tata Kelola Sarana & Prasarana Sekolah yang Tertib, Transparan, dan Modern.*
