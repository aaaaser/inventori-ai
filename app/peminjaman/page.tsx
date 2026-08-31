'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Package,
  Calendar,
  User,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';
import { BorrowingRecord, SchoolAsset } from '@/lib/types';
import { BorrowingStatus, BORROWING_STATUS_LABELS } from '@/lib/rbac';

export default function PeminjamanPage() {
  const { user, can } = useAuth();
  const { showToast } = useToast();

  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>([]);
  const [availableAssets, setAvailableAssets] = useState<SchoolAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Request Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formJurusanId, setFormJurusanId] = useState<string>('1');
  const [formTanggalPinjam, setFormTanggalPinjam] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formTanggalKembali, setFormTanggalKembali] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formTujuan, setFormTujuan] = useState('');
  const [formKeperluan, setFormKeperluan] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);

  // Approve / Reject Dialog State
  const [actionTarget, setActionTarget] = useState<BorrowingRecord | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'handover' | 'return' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchBorrowings = async () => {
    try {
      setIsLoading(true);
      const url =
        statusFilter && statusFilter !== 'all'
          ? `/api/borrowings?status=${statusFilter}`
          : '/api/borrowings';

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBorrowings(json.data);
      }
    } catch (err) {
      console.error('Error fetching borrowings:', err);
      showToast('Gagal memuat data peminjaman', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableAssets = async (jurusanIdStr?: string) => {
    try {
      const jurId = jurusanIdStr || formJurusanId;
      const jurCode = jurId === '1' ? 'RPL' : jurId === '2' ? 'ATPH' : 'TBSM';
      const res = await fetch(`/api/assets?status=TERSEDIA&jurusan=${jurCode}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAvailableAssets(json.data);
      }
    } catch (err) {
      console.error('Error fetching available assets:', err);
    }
  };

  useEffect(() => {
    fetchBorrowings();
  }, [statusFilter]);

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchAvailableAssets(formJurusanId);
    }
  }, [isCreateModalOpen, formJurusanId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTujuan || !formKeperluan) {
      showToast('Tujuan dan keperluan peminjaman wajib diisi', 'warning');
      return;
    }

    if (selectedAssetIds.length === 0) {
      showToast('Pilih minimal 1 unit aset yang akan dipinjam', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/borrowings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurusan_id: Number(formJurusanId),
          tanggal_peminjaman: formTanggalPinjam,
          tanggal_pengembalian_rencana: formTanggalKembali,
          tujuan: formTujuan,
          keperluan: formKeperluan,
          catatan: formCatatan,
          asset_ids: selectedAssetIds,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Pengajuan peminjaman berhasil dikirim ke Kakom!', 'success');
        setIsCreateModalOpen(false);
        setFormTujuan('');
        setFormKeperluan('');
        setFormCatatan('');
        setSelectedAssetIds([]);
        fetchBorrowings();
      } else {
        showToast(json.message || 'Gagal membuat pengajuan', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionTarget || !actionType) return;

    try {
      setIsProcessingAction(true);
      let endpoint = '';
      let body: any = {};

      if (actionType === 'approve') {
        endpoint = `/api/borrowings/${actionTarget.id}/approve`;
        body = { catatan: actionNote };
      } else if (actionType === 'reject') {
        if (!actionNote.trim()) {
          showToast('Alasan penolakan wajib diisi', 'warning');
          setIsProcessingAction(false);
          return;
        }
        endpoint = `/api/borrowings/${actionTarget.id}/reject`;
        body = { alasan: actionNote };
      } else if (actionType === 'handover') {
        endpoint = `/api/borrowings/${actionTarget.id}/handover`;
      } else if (actionType === 'return') {
        endpoint = `/api/borrowings/${actionTarget.id}/return`;
        body = {
          itemConditions: actionTarget.items.map((it) => ({
            item_id: it.id,
            asset_id: it.asset_id,
            kondisi: 'BAIK',
          })),
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Aksi berhasil diproses!', 'success');
        setActionTarget(null);
        setActionType(null);
        setActionNote('');
        fetchBorrowings();
      } else {
        showToast(json.message || 'Gagal memproses aksi', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const toggleAssetSelection = (assetId: number) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const getStatusBadge = (status: BorrowingStatus) => {
    switch (status) {
      case 'MENUNGGU_PERSETUJUAN_KAKOM':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-sm">
            Menunggu Kakom
          </span>
        );
      case 'MENUNGGU_PERSETUJUAN_SARPRAS':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-sm">
            Menunggu Waka Sarpras
          </span>
        );
      case 'MENUNGGU_PERSETUJUAN_KEPSEK':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-sm">
            Menunggu Kepala Sekolah
          </span>
        );
      case 'DISETUJUI':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-sm">
            Disetujui (Siap Serah Terima)
          </span>
        );
      case 'DIPINJAM':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-sm">
            Sedang Dipinjam
          </span>
        );
      case 'DIKEMBALIKAN':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-sm">
            Selesai / Dikembalikan
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-sm">
            Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  const canApproveCurrent = (b: BorrowingRecord) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;

    if (b.status === 'MENUNGGU_PERSETUJUAN_KAKOM') {
      return user.role === 'KAKOM' && (!user.jurusan_kode || user.jurusan_kode === b.jurusan_kode);
    }
    if (b.status === 'MENUNGGU_PERSETUJUAN_SARPRAS') {
      return user.role === 'WAKA_SARPRAS';
    }
    if (b.status === 'MENUNGGU_PERSETUJUAN_KEPSEK') {
      return user.role === 'KEPALA_SEKOLAH';
    }
    return false;
  };

  const canCreateBorrowing = can('borrowing.create') || user?.role === 'LABORAN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              ALUR PEMINJAMAN ASET
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Alur persetujuan bertingkat: Laboran &rarr; Kakom &rarr; Waka Sarpras &rarr; Kepala Sekolah.
          </p>
        </div>

        {canCreateBorrowing && (
          <Button
            id="btn-tambah-peminjaman"
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Ajukan Peminjaman
          </Button>
        )}
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'Semua Status' },
          { id: 'MENUNGGU_PERSETUJUAN_KAKOM', label: 'Tahap Kakom' },
          { id: 'MENUNGGU_PERSETUJUAN_SARPRAS', label: 'Tahap Sarpras' },
          { id: 'MENUNGGU_PERSETUJUAN_KEPSEK', label: 'Tahap Kepsek' },
          { id: 'DISETUJUI', label: 'Disetujui' },
          { id: 'DIPINJAM', label: 'Dipinjam' },
          { id: 'DIKEMBALIKAN', label: 'Selesai' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-2.5 py-1 rounded-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <Loading message="Memuat data pengajuan & riwayat persetujuan..." />
      ) : borrowings.length === 0 ? (
        <EmptyState
          title="Belum ada pengajuan peminjaman"
          description="Gunakan tombol di atas untuk mengajukan peminjaman aset baru."
          actionLabel={canCreateBorrowing ? '+ Buat Pengajuan Baru' : undefined}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        /* Borrowings List */
        <div className="space-y-3">
          {borrowings.map((b) => {
            const hasApprovePower = canApproveCurrent(b);

            return (
              <Card key={b.id} className="p-4 space-y-3">
                {/* Top bar: Code, Jurusan, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                      {b.nomor_peminjaman}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-sm border border-neutral-300 dark:border-neutral-700">
                      {b.jurusan_kode}
                    </span>
                  </div>
                  <div>{getStatusBadge(b.status)}</div>
                </div>

                {/* Main Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <span className="text-[11px] text-neutral-500 block">Tujuan & Keperluan:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {b.tujuan}
                    </span>
                    <p className="text-neutral-600 dark:text-neutral-400 text-[11px] mt-0.5">
                      {b.keperluan}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-neutral-500 block">Jadwal Peminjaman:</span>
                    <div className="text-neutral-800 dark:text-neutral-200 flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3 h-3 text-neutral-400" />
                      <span>{b.tanggal_peminjaman}</span>
                      <span>&rarr;</span>
                      <span>{b.tanggal_pengembalian_rencana}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">
                      Diajukan oleh: {b.peminjam_nama}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-neutral-500 block">Unit Aset ({b.items?.length || 0}):</span>
                    <div className="space-y-0.5 mt-0.5">
                      {b.items?.map((it) => (
                        <div
                          key={it.id}
                          className="text-[11px] font-mono text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
                        >
                          <Package className="w-3 h-3 text-neutral-400" />
                          <span>{it.kode_unit}</span>
                          <span className="text-neutral-500">({it.nama_barang})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Workflow Progress Steps */}
                <div className="p-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-sm border border-neutral-200 dark:border-neutral-800 text-[11px] space-y-1">
                  <div className="font-semibold text-neutral-600 dark:text-neutral-400">
                    Jejak Persetujuan:
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-neutral-700 dark:text-neutral-300">
                    {b.approvals && b.approvals.length > 0 ? (
                      b.approvals.map((app) => (
                        <div key={app.id} className="flex items-center gap-1">
                          {app.status === 'APPROVED' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          )}
                          <span className="font-medium">{app.role}</span>
                          <span className="text-neutral-400 text-[10px]">
                            ({app.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'})
                          </span>
                          {app.catatan && (
                            <span className="italic text-neutral-500 text-[10px]">
                              - &ldquo;{app.catatan}&rdquo;
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-neutral-400 italic">Menunggu review Kakom jurusan</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons for Authorized Roles */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  {/* Approval Action Buttons */}
                  {hasApprovePower && (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => {
                          setActionTarget(b);
                          setActionType('reject');
                          setActionNote('');
                        }}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Tolak Pengajuan
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                        onClick={() => {
                          setActionTarget(b);
                          setActionType('approve');
                          setActionNote('');
                        }}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Setujui ({user?.role})
                      </Button>
                    </>
                  )}

                  {/* Handover Button (Serah Terima Fisik Barang) */}
                  {b.status === 'DISETUJUI' && (can('borrowing.handover') || user?.role === 'SUPER_ADMIN') && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => {
                        setActionTarget(b);
                        setActionType('handover');
                      }}
                      leftIcon={<FileCheck className="w-3.5 h-3.5" />}
                    >
                      Serah Terima Barang (Mulai Pinjam)
                    </Button>
                  )}

                  {/* Return Button (Pengembalian Barang) */}
                  {b.status === 'DIPINJAM' && (can('borrowing.return') || user?.role === 'SUPER_ADMIN') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => {
                        setActionTarget(b);
                        setActionType('return');
                      }}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Konfirmasi Pengembalian
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Borrowing Request Dialog */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Ajukan Peminjaman Aset Baru"
        description="Pilih jurusan dan unit aset yang akan dipinjam untuk diteruskan ke alur persetujuan."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateSubmit}
              isLoading={isSubmitting}
            >
              Kirim Pengajuan
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Jurusan Pemilik Aset
            </label>
            <Select
              value={formJurusanId}
              onChange={(e) => {
                setFormJurusanId(e.target.value);
                setSelectedAssetIds([]);
              }}
              options={[
                { value: '1', label: 'RPL (Rekayasa Perangkat Lunak)' },
                { value: '2', label: 'ATPH (Agribisnis Tanaman Pangan & Hortikultura)' },
                { value: '3', label: 'TBSM (Teknik & Bisnis Sepeda Motor)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Tanggal Mulai Pinjam
              </label>
              <Input
                type="date"
                required
                value={formTanggalPinjam}
                onChange={(e) => setFormTanggalPinjam(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Rencana Pengembalian
              </label>
              <Input
                type="date"
                required
                value={formTanggalKembali}
                onChange={(e) => setFormTanggalKembali(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Tujuan Peminjaman
            </label>
            <Input
              required
              value={formTujuan}
              onChange={(e) => setFormTujuan(e.target.value)}
              placeholder="Contoh: Praktikum Pemrograman Web Kelas XII"
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Keperluan & Penjelasan
            </label>
            <Input
              required
              value={formKeperluan}
              onChange={(e) => setFormKeperluan(e.target.value)}
              placeholder="Contoh: Digunakan untuk uji kompetensi siswa di Lab 1"
              className="text-xs"
            />
          </div>

          {/* Unit Aset Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Pilih Unit Aset ({selectedAssetIds.length} dipilih)
            </label>
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-sm max-h-40 overflow-y-auto p-1.5 space-y-1 bg-neutral-50 dark:bg-neutral-900">
              {availableAssets.length === 0 ? (
                <div className="text-center py-3 text-xs text-neutral-400">
                  Tidak ada aset siap pakai pada jurusan ini.
                </div>
              ) : (
                availableAssets.map((asset) => {
                  const isChecked = selectedAssetIds.includes(asset.id);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => toggleAssetSelection(asset.id)}
                      className={`p-1.5 rounded-sm border flex items-center justify-between text-xs cursor-pointer select-none transition-colors ${
                        isChecked
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[11px] font-bold">
                          {asset.kode_unit}
                        </span>
                        <span className="truncate">{asset.nama_barang}</span>
                      </div>
                      <span className="text-[10px] opacity-80 shrink-0 font-mono">
                        {asset.ruangan_nama}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>
      </Dialog>

      {/* Approve / Reject / Handover Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(actionTarget && actionType)}
        onClose={() => {
          setActionTarget(null);
          setActionType(null);
        }}
        title={
          actionType === 'approve'
            ? 'Setujui Pengajuan Peminjaman'
            : actionType === 'reject'
            ? 'Tolak Pengajuan Peminjaman'
            : actionType === 'handover'
            ? 'Konfirmasi Serah Terima Barang'
            : 'Konfirmasi Pengembalian Barang'
        }
        description={
          actionType === 'approve'
            ? `Konfirmasi persetujuan oleh ${user?.role} untuk pengajuan ${actionTarget?.nomor_peminjaman}.`
            : actionType === 'reject'
            ? `Berikan alasan penolakan untuk pengajuan ${actionTarget?.nomor_peminjaman}.`
            : actionType === 'handover'
            ? `Serahkan fisik barang ke peminjam. Status unit aset akan terkunci sebagai DIPINJAM.`
            : `Terima kembali fisik barang. Status unit aset akan dikembalikan menjadi TERSEDIA.`
        }
        variant={actionType === 'reject' ? 'danger' : 'info'}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActionTarget(null);
                setActionType(null);
              }}
              disabled={isProcessingAction}
            >
              Batal
            </Button>
            <Button
              variant={actionType === 'reject' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleExecuteAction}
              isLoading={isProcessingAction}
            >
              {actionType === 'approve'
                ? 'Ya, Setujui'
                : actionType === 'reject'
                ? 'Tolak Pengajuan'
                : actionType === 'handover'
                ? 'Konfirmasi Serah Terima'
                : 'Selesaikan Pengembalian'}
            </Button>
          </>
        }
      >
        <div className="space-y-3 pt-1 text-xs">
          <div className="p-2.5 rounded-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <div className="font-bold text-neutral-900 dark:text-white">
              {actionTarget?.nomor_peminjaman} - {actionTarget?.tujuan}
            </div>
            <div className="text-neutral-500 font-mono text-[11px] mt-0.5">
              Jurusan: {actionTarget?.jurusan_kode} · Peminjam: {actionTarget?.peminjam_nama}
            </div>
          </div>

          {(actionType === 'approve' || actionType === 'reject') && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                {actionType === 'reject' ? 'Alasan Penolakan (Wajib)' : 'Catatan Persetujuan (Opsional)'}
              </label>
              <Input
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionType === 'reject'
                    ? 'Tuliskan alasan mengapa pengajuan ditolak...'
                    : 'Catatan tambahan...'
                }
                className="text-xs"
                autoFocus
              />
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
