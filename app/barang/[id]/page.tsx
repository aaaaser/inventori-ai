'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Package,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode as QrCodeIcon,
  Printer,
  Wrench,
  History,
  FileText,
  DollarSign,
  MapPin,
  Tag,
  ShieldCheck,
  Plus,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { AssetData, AssetGroupData, AssetMaintenanceData, BorrowingData, AssetHistoryData, UserSession } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import QRCode from 'qrcode';

export default function DetailBarangPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [asset, setAsset] = useState<AssetData | null>(null);
  const [assetGroup, setAssetGroup] = useState<AssetGroupData | null>(null);
  const [maintenances, setMaintenances] = useState<AssetMaintenanceData[]>([]);
  const [borrowingHistory, setBorrowingHistory] = useState<BorrowingData[]>([]);
  const [histories, setHistories] = useState<AssetHistoryData[]>([]);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Delete modal
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Maintenance modal
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isSubmittingMaintenance, setIsSubmittingMaintenance] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    tanggal_perawatan: new Date().toISOString().slice(0, 10),
    jenis_perawatan: 'Pembersihan & Pengecekan Berkala',
    pelaksana: '',
    biaya: 0,
    kondisi_sebelum: 'BAIK',
    kondisi_sesudah: 'BAIK',
    status: 'SELESAI',
    catatan: '',
  });

  // Fetch current user session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setMaintenanceForm((prev) => ({
            ...prev,
            pelaksana: data.user.name || '',
          }));
        }
      })
      .catch((err) => console.error('Error fetching me:', err));
  }, []);

  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage('');

      const res = await fetch(`/api/assets/${params.id}`);
      const data = await res.json();

      if (data.success && data.data) {
        const item: AssetData = data.data;
        setAsset(item);
        setAssetGroup(data.data.assetGroup || null);
        setMaintenances(data.data.maintenances || []);
        setBorrowingHistory(data.data.borrowingHistory || []);
        setHistories(data.data.histories || []);

        setMaintenanceForm((prev) => ({
          ...prev,
          kondisi_sebelum: item.kondisi || 'BAIK',
          kondisi_sesudah: item.kondisi || 'BAIK',
        }));

        // Generate QR code for this unit URL
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const unitUrl = `${origin}/barang/${item.id}`;
        try {
          const url = await QRCode.toDataURL(unitUrl, {
            width: 320,
            margin: 1,
            color: {
              dark: '#09090b',
              light: '#ffffff',
            },
          });
          setQrDataUrl(url);
        } catch (e) {
          console.error('QR code generation error:', e);
        }
      } else {
        setIsError(true);
        setErrorMessage(data.message || 'Data tidak ditemukan');
      }
    } catch (err: any) {
      console.error('Error fetching detail:', err);
      setIsError(true);
      setErrorMessage(err.message || 'Gagal memuat data aset');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchDetail();
    }
  }, [params.id]);

  const handleDeleteConfirm = async () => {
    if (!asset) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Aset unit "${asset.kode_barang}" berhasil dihapus`, 'success');
        setIsDeleteDialogOpen(false);
        router.push('/barang');
      } else {
        showToast(data.message || 'Gagal menghapus aset', 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    try {
      setIsSubmittingMaintenance(true);
      const res = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset.id,
          tanggal_perawatan: maintenanceForm.tanggal_perawatan,
          jenis_perawatan: maintenanceForm.jenis_perawatan,
          deskripsi: maintenanceForm.catatan || `Perawatan ${maintenanceForm.jenis_perawatan}`,
          pelaksana: maintenanceForm.pelaksana,
          biaya: Number(maintenanceForm.biaya) || 0,
          kondisi_sebelum: maintenanceForm.kondisi_sebelum,
          kondisi_sesudah: maintenanceForm.kondisi_sesudah,
          status: maintenanceForm.status,
          catatan: maintenanceForm.catatan,
        }),
      });

      const result = await res.json();

      if (result.success) {
        showToast('Catatan perawatan berhasil disimpan!', 'success');
        setIsMaintenanceModalOpen(false);
        fetchDetail();
      } else {
        showToast(result.message || 'Gagal menyimpan catatan perawatan', 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setIsSubmittingMaintenance(false);
    }
  };

  const copyUnitLink = () => {
    if (typeof window === 'undefined' || !asset) return;
    const url = `${window.location.origin}/barang/${asset.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    showToast('Tautan unit barang disalin ke clipboard', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadQrCode = () => {
    if (!qrDataUrl || !asset) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-${asset.kode_barang}.png`;
    link.click();
  };

  const handlePrintQr = () => {
    if (typeof window === 'undefined' || !asset) return;
    const printWindow = window.open('', '_blank', 'width=450,height=550');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label QR Code - ${asset.kode_barang}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #fff;
              color: #0f172a;
            }
            .label-card {
              width: 320px;
              border: 2px solid #0f172a;
              border-radius: 8px;
              padding: 16px;
              text-align: center;
              box-sizing: border-box;
            }
            .header-title {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #475569;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin-bottom: 10px;
            }
            .item-code {
              font-size: 16px;
              font-weight: 800;
              font-family: monospace;
              letter-spacing: 1px;
              margin: 4px 0;
            }
            .item-name {
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 12px;
              color: #1e293b;
            }
            .qr-image {
              width: 180px;
              height: 180px;
              margin: 0 auto 10px;
              display: block;
            }
            .meta-grid {
              font-size: 10px;
              color: #64748b;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px;
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
              text-align: left;
            }
            @media print {
              body { background: transparent; }
              .label-card { border-width: 1.5px; page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header-title">INVENTARIS ASET SEKOLAH · ${asset.jurusan_kode || 'SMK'}</div>
            <div class="item-code">${asset.kode_barang}</div>
            <div class="item-name">${asset.nama_barang}</div>
            <img src="${qrDataUrl}" class="qr-image" alt="QR Code" />
            <div class="meta-grid">
              <div><strong>Ruangan:</strong> ${asset.ruangan_nama || '-'}</div>
              <div><strong>Kondisi:</strong> ${asset.kondisi}</div>
              <div><strong>Nomor Seri:</strong> ${asset.nomor_seri || '-'}</div>
              <div><strong>Perolehan:</strong> ${asset.tahun_perolehan || '-'}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateStr));
    } catch {
      return String(dateStr);
    }
  };

  const formatRupiah = (val?: number | null) => {
    if (!val && val !== 0) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getKondisiBadge = (kondisi: string) => {
    const k = kondisi.toUpperCase().replace(/\s+/g, '_');
    switch (k) {
      case 'BAIK':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      case 'RUSAK_RINGAN':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
      case 'RUSAK_BERAT':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
      default:
        return 'text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TERSEDIA':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      case 'DIPINJAM':
        return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
      case 'PERAWATAN':
      case 'PERBAIKAN':
        return 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800';
      case 'RUSAK':
      case 'TIDAK_AKTIF':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
      default:
        return 'text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    }
  };

  const getJurusanBadge = (kode?: string) => {
    switch (kode) {
      case 'RPL':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'ATPH':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'TBSM':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';
    }
  };

  const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OPERATOR' || currentUser?.role === 'LABORAN';

  if (isLoading) {
    return <Loading message="Memuat detail unit aset..." className="py-16" />;
  }

  if (isError || !asset) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-10 h-10 rounded-sm bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Data Aset Tidak Ditemukan
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
          {errorMessage || 'Aset yang Anda cari mungkin telah dihapus atau berada di luar cakupan akses jurusan Anda.'}
        </p>
        <Link href="/barang">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Kembali ke Daftar Barang
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="pb-3 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/barang">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Kembali
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Detail Unit Aset
              </h1>
              {asset.jurusan_kode && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-sm border ${getJurusanBadge(asset.jurusan_kode)}`}>
                  Jurusan {asset.jurusan_kode}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
              {asset.kode_barang}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintQr}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Cetak Label QR
          </Button>

          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMaintenanceModalOpen(true)}
                leftIcon={<Wrench className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
              >
                Catat Perawatan
              </Button>
              <Link href={`/barang/${asset.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Hapus
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Detail & QR Code Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Asset Specifications & Relations */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                    {asset.kode_barang}
                  </span>
                  {asset.nomor_unit && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      Unit #{asset.nomor_unit}
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mt-1">
                  {asset.nama_barang}
                </h2>
                {assetGroup && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Kelompok Jenis: <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">{assetGroup.kode_kelompok}</span> ({assetGroup.nama_barang})
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-sm border ${getStatusBadge(asset.status)}`}>
                  {asset.status}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm border ${getKondisiBadge(asset.kondisi)}`}>
                  Kondisi: {asset.kondisi}
                </span>
              </div>
            </div>

            {/* Spec Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
                <span className="text-neutral-500 dark:text-neutral-400 block">Kategori</span>
                <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-400" />
                  {asset.kategori || '-'}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
                <span className="text-neutral-500 dark:text-neutral-400 block">Ruangan / Penempatan</span>
                <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  {asset.ruangan_nama || '-'}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
                <span className="text-neutral-500 dark:text-neutral-400 block">Merk & Model / Tipe</span>
                <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-neutral-400" />
                  {asset.merk ? `${asset.merk} ${asset.tipe || ''}`.trim() : '-'}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
                <span className="text-neutral-500 dark:text-neutral-400 block">Nomor Seri (Serial Number)</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                  {asset.nomor_seri || '-'}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
                <span className="text-neutral-500 dark:text-neutral-400 block">Tahun & Sumber Dana</span>
                <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  {asset.tahun_perolehan || '-'} · {asset.sumber_dana || 'BOS'}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm space-y-1">
                <span className="text-neutral-500 dark:text-neutral-400 block">Harga Perolehan</span>
                <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
                  {formatRupiah(asset.harga_perolehan)}
                </span>
              </div>
            </div>

            {asset.keterangan && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm text-xs">
                <span className="text-neutral-500 dark:text-neutral-400 block font-medium mb-0.5">Keterangan / Catatan Fisik:</span>
                <p className="text-neutral-800 dark:text-neutral-200">{asset.keterangan}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Dynamic QR Code Card & Quick Print */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-5 space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
              <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <QrCodeIcon className="w-4 h-4 text-neutral-500" />
                QR Code Unit
              </span>
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                {asset.kode_barang}
              </span>
            </div>

            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm inline-block mx-auto">
                <img
                  src={qrDataUrl}
                  alt={`QR Code ${asset.kode_barang}`}
                  className="w-40 h-40 object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="w-40 h-40 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-center justify-center text-xs text-neutral-400 mx-auto">
                Membuat QR...
              </div>
            )}

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-[240px] mx-auto">
              Scan dengan kamera HP untuk langsung membuka spesifikasi aset, status, dan riwayat perawatan.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQrCode}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Unduh PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyUnitLink}
                leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {isCopied ? 'Tersalin!' : 'Salin URL'}
              </Button>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={handlePrintQr}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Cetak Label Fisik
            </Button>
          </Card>
        </div>
      </div>

      {/* Section: Riwayat Perawatan (Maintenance History) */}
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Riwayat Perawatan & Perbaikan ({maintenances.length})
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Catatan servis berkala, perbaikan komponen, dan inspeksi fisik unit ini.
            </p>
          </div>

          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMaintenanceModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Catat Perawatan Baru
            </Button>
          )}
        </div>

        {maintenances.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
            Belum ada riwayat perawatan untuk unit ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Jenis Perawatan</th>
                  <th className="py-2.5 px-3">Pelaksana</th>
                  <th className="py-2.5 px-3">Biaya</th>
                  <th className="py-2.5 px-3">Kondisi (Sebelum → Sesudah)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {maintenances.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                    <td className="py-2.5 px-3 font-mono font-medium text-neutral-900 dark:text-white whitespace-nowrap">
                      {m.tanggal_perawatan}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {m.jenis_perawatan}
                      {m.deskripsi && m.deskripsi !== m.jenis_perawatan && (
                        <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 font-normal mt-0.5">
                          {m.deskripsi}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300">
                      {m.pelaksana}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-700 dark:text-neutral-300">
                      {m.biaya > 0 ? formatRupiah(m.biaya) : 'Rp 0'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${getKondisiBadge(m.kondisi_sebelum)}`}>
                          {m.kondisi_sebelum}
                        </span>
                        <span className="text-neutral-400">→</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${getKondisiBadge(m.kondisi_sesudah)}`}>
                          {m.kondisi_sesudah}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${
                        m.status === 'SELESAI'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : m.status === 'PROSES'
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                          : 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-500 dark:text-neutral-400 max-w-xs truncate">
                      {m.catatan || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Section: Riwayat Peminjaman (Borrowing History) */}
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Riwayat Peminjaman Unit ({borrowingHistory.length})
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Daftar pengajuan peminjaman di mana unit aset ini pernah digunakan.
          </p>
        </div>

        {borrowingHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
            Belum ada riwayat peminjaman untuk unit ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">No. Pengajuan</th>
                  <th className="py-2.5 px-3">Peminjam</th>
                  <th className="py-2.5 px-3">Tanggal Pinjam</th>
                  <th className="py-2.5 px-3">Tujuan / Keperluan</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {borrowingHistory.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                    <td className="py-2.5 px-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                      <Link href={`/peminjaman/${b.id}`} className="hover:underline">
                        {b.nomor_pengajuan}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-900 dark:text-neutral-100 font-medium">
                      {b.user_name}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400 font-mono">
                      {b.tanggal_peminjaman} s/d {b.tanggal_pengembalian_rencana}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300 max-w-xs truncate">
                      {b.tujuan}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm border bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Section: Timeline Riwayat Aset (Mutation Log) */}
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            Log Aktivitas & Riwayat Perubahan Unit ({histories.length})
          </h3>
        </div>

        {histories.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
            Belum ada log aktivitas untuk unit ini.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {histories.map((h) => (
              <div key={h.id} className="p-3 rounded-sm bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-xs flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {h.action}
                    </span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Oleh: {h.user_name || 'Sistem'}
                    </span>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300">{h.description}</p>
                  {h.new_value && (
                    <p className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      {h.new_value}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-neutral-400 font-mono shrink-0">
                  {formatDate(h.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Catat Perawatan Modal Dialog */}
      <Dialog
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title="Catat Perawatan / Servis Unit"
        description={`Masukkan rincian perawatan untuk unit ${asset.kode_barang} (${asset.nama_barang}).`}
      >
        <form onSubmit={handleCreateMaintenance} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Tanggal Perawatan"
                type="date"
                value={maintenanceForm.tanggal_perawatan}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, tanggal_perawatan: e.target.value })}
                required
                disabled={isSubmittingMaintenance}
              />
            </div>
            <div>
              <Input
                label="Pelaksana / Teknisi"
                placeholder="Contoh: Laboran RPL / Teknisi Servis"
                value={maintenanceForm.pelaksana}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, pelaksana: e.target.value })}
                required
                disabled={isSubmittingMaintenance}
              />
            </div>
          </div>

          <div>
            <Input
              label="Jenis Perawatan"
              placeholder="Contoh: Pembersihan Berkala, Ganti Pasta Thermal, Servis Karburator"
              value={maintenanceForm.jenis_perawatan}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, jenis_perawatan: e.target.value })}
              required
              disabled={isSubmittingMaintenance}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Select
                label="Kondisi Sebelum"
                value={maintenanceForm.kondisi_sebelum}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, kondisi_sebelum: e.target.value })}
                options={[
                  { value: 'BAIK', label: 'Baik' },
                  { value: 'RUSAK_RINGAN', label: 'Rusak Ringan' },
                  { value: 'RUSAK_BERAT', label: 'Rusak Berat' },
                ]}
                disabled={isSubmittingMaintenance}
              />
            </div>
            <div>
              <Select
                label="Kondisi Sesudah"
                value={maintenanceForm.kondisi_sesudah}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, kondisi_sesudah: e.target.value })}
                options={[
                  { value: 'BAIK', label: 'Baik' },
                  { value: 'RUSAK_RINGAN', label: 'Rusak Ringan' },
                  { value: 'RUSAK_BERAT', label: 'Rusak Berat' },
                ]}
                disabled={isSubmittingMaintenance}
              />
            </div>
            <div>
              <Select
                label="Status Perawatan"
                value={maintenanceForm.status}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, status: e.target.value })}
                options={[
                  { value: 'SELESAI', label: 'Selesai (Siap Pakai)' },
                  { value: 'PROSES', label: 'Dalam Proses' },
                  { value: 'DIJADWALKAN', label: 'Dijadwalkan' },
                ]}
                disabled={isSubmittingMaintenance}
              />
            </div>
          </div>

          <div>
            <Input
              label="Biaya Perawatan (Rp)"
              type="number"
              min="0"
              placeholder="0"
              value={maintenanceForm.biaya}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, biaya: Number(e.target.value) })}
              disabled={isSubmittingMaintenance}
            />
          </div>

          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">
              Catatan / Hasil Pemeriksaan
            </label>
            <textarea
              className="w-full px-3 py-2 text-xs rounded-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              rows={3}
              placeholder="Catatan rincian komponen yang diganti atau hasil pengujian..."
              value={maintenanceForm.catatan}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, catatan: e.target.value })}
              disabled={isSubmittingMaintenance}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMaintenanceModalOpen(false)}
              disabled={isSubmittingMaintenance}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingMaintenance}
            >
              Simpan Perawatan
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Hapus Unit Aset?"
        description={`Apakah Anda yakin ingin menghapus unit "${asset.kode_barang}"?`}
        variant="danger"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              Hapus Unit
            </Button>
          </>
        }
      >
        <div className="p-2.5 rounded-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
          <p className="font-semibold text-neutral-900 dark:text-white">
            {asset.nama_barang}
          </p>
          <p className="text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
            {asset.kode_barang} · {asset.ruangan_nama || 'Lab'} · {asset.jurusan_kode}
          </p>
        </div>
      </Dialog>
    </div>
  );
}
