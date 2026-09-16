'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  QrCode,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Printer,
  Download,
  Copy,
  Check,
  RefreshCw,
  X,
  SlidersHorizontal,
  MapPin,
  Package,
  Layers,
  Calendar,
  DollarSign,
  ShieldCheck,
  ExternalLink,
  Wrench,
  FileText,
} from 'lucide-react';
import { Barang, UserSession, AssetData, AssetMaintenanceData, BorrowingData } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import QRCode from 'qrcode';

type SortColumn = 'kode' | 'kode_kelompok' | 'nama' | 'jurusan' | 'ruangan' | 'kondisi' | 'status';
type SortDirection = 'asc' | 'desc';

interface BarangDataTableProps {
  currentUser: UserSession | null;
  items: Barang[];
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
  onDeleteSuccess?: () => void;
  serverTotal?: number;
}

export function BarangDataTable({
  currentUser,
  items,
  isLoading,
  isError,
  onRefresh,
  onDeleteSuccess,
}: BarangDataTableProps) {
  const { showToast } = useToast();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJurusan, setFilterJurusan] = useState<string>('all');
  const [filterKondisi, setFilterKondisi] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting State
  const [sortColumn, setSortColumn] = useState<SortColumn>('kode');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Interactive Modals State
  const [selectedQrItem, setSelectedQrItem] = useState<Barang | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Quick Detail Modal State
  const [detailItem, setDetailItem] = useState<Barang | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fullAssetDetail, setFullAssetDetail] = useState<{
    asset: AssetData | null;
    maintenances: AssetMaintenanceData[];
    borrowings: BorrowingData[];
  } | null>(null);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<Barang | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // RBAC scope check
  const isLaboranOrKakom = currentUser?.role === 'LABORAN' || currentUser?.role === 'KAKOM';
  const isSuperAdminOrOperator = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OPERATOR';

  // Can user edit/delete?
  const canModifyItem = (item: Barang): boolean => {
    if (isSuperAdminOrOperator) return true;
    if (currentUser?.role === 'LABORAN') {
      return !currentUser.jurusan_kode || item.jurusan === currentUser.jurusan_kode;
    }
    return false;
  };

  // Generate QR Code when QR modal is opened
  useEffect(() => {
    if (selectedQrItem) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const unitUrl = `${origin}/barang/${selectedQrItem.id}`;
      QRCode.toDataURL(unitUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#09090b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    } else {
      setQrCodeDataUrl('');
    }
  }, [selectedQrItem]);

  // Fetch full details when Quick Detail modal is opened
  useEffect(() => {
    if (detailItem) {
      setDetailLoading(true);
      fetch(`/api/assets/${detailItem.id}`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success && res.data) {
            setFullAssetDetail({
              asset: res.data,
              maintenances: res.data.maintenances || [],
              borrowings: res.data.borrowingHistory || [],
            });
          } else {
            setFullAssetDetail(null);
          }
        })
        .catch((err) => {
          console.error('Error loading asset detail:', err);
          setFullAssetDetail(null);
        })
        .finally(() => setDetailLoading(false));
    } else {
      setFullAssetDetail(null);
    }
  }, [detailItem]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterJurusan, filterKondisi, filterStatus, entriesPerPage]);

  // Filtered and Sorted items
  const processedItems = useMemo(() => {
    let result = [...items];

    // 1. Search Filter (Multi-column search)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((item) => {
        const kode = (item.kode || '').toLowerCase();
        const jenis = (item.kode_kelompok || '').toLowerCase();
        const nama = (item.nama || '').toLowerCase();
        const jurusan = (item.jurusan || '').toLowerCase();
        const ruangan = (item.ruangan || '').toLowerCase();
        const kondisi = (item.kondisi || '').toLowerCase();
        const status = (item.status || '').toLowerCase();
        const merk = (item.merk || '').toLowerCase();
        const sn = (item.nomor_seri || '').toLowerCase();

        return (
          kode.includes(q) ||
          jenis.includes(q) ||
          nama.includes(q) ||
          jurusan.includes(q) ||
          ruangan.includes(q) ||
          kondisi.includes(q) ||
          status.includes(q) ||
          merk.includes(q) ||
          sn.includes(q)
        );
      });
    }

    // 2. Jurusan Filter (for Super Admin / non-scoped users)
    if (filterJurusan !== 'all') {
      result = result.filter((item) => item.jurusan === filterJurusan);
    }

    // 3. Kondisi Filter
    if (filterKondisi !== 'all') {
      result = result.filter((item) => {
        const itemKondisi = item.kondisi.toUpperCase().replace(/\s+/g, '_');
        const filterK = filterKondisi.toUpperCase().replace(/\s+/g, '_');
        return itemKondisi === filterK;
      });
    }

    // 4. Status Filter
    if (filterStatus !== 'all') {
      result = result.filter((item) => (item.status || 'TERSEDIA') === filterStatus);
    }

    // 5. Sorting
    result.sort((a, b) => {
      let aVal = '';
      let bVal = '';

      switch (sortColumn) {
        case 'kode':
          aVal = a.kode || '';
          bVal = b.kode || '';
          break;
        case 'kode_kelompok':
          aVal = a.kode_kelompok || '';
          bVal = b.kode_kelompok || '';
          break;
        case 'nama':
          aVal = a.nama || '';
          bVal = b.nama || '';
          break;
        case 'jurusan':
          aVal = a.jurusan || '';
          bVal = b.jurusan || '';
          break;
        case 'ruangan':
          aVal = a.ruangan || '';
          bVal = b.ruangan || '';
          break;
        case 'kondisi':
          aVal = a.kondisi || '';
          bVal = b.kondisi || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          aVal = a.kode || '';
          bVal = b.kode || '';
      }

      const comparison = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, searchTerm, filterJurusan, filterKondisi, filterStatus, sortColumn, sortDirection]);

  // Pagination Math
  const totalEntries = processedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
  const currentPaginatedItems = processedItems.slice(startIndex, endIndex);

  // Sorting Handler
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Render Sort Header Indicator
  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 ml-1 inline-block shrink-0" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-black dark:text-white font-bold ml-1 inline-block shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-black dark:text-white font-bold ml-1 inline-block shrink-0" />
    );
  };

  // Pagination Page Number Generator with Ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Delete Action Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/barang/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Unit barang "${deleteTarget.kode}" berhasil dihapus.`, 'success');
        setDeleteTarget(null);
        if (onDeleteSuccess) onDeleteSuccess();
        onRefresh();
      } else {
        showToast(data.message || 'Gagal menghapus unit barang.', 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungi server.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper Badge Colors
  const getKondisiBadge = (kondisiStr: string) => {
    const k = kondisiStr.toUpperCase().replace(/\s+/g, '_');
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

  const getStatusBadge = (statusStr?: string) => {
    switch (statusStr) {
      case 'TERSEDIA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'DIPINJAM':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'PERBAIKAN':
      case 'PERAWATAN':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      case 'HILANG':
      case 'RUSAK':
      case 'TIDAK_AKTIF':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';
    }
  };

  const getJurusanBadge = (jurusanStr?: string) => {
    switch (jurusanStr) {
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

  const copyQrLink = () => {
    if (!selectedQrItem || typeof window === 'undefined') return;
    const url = `${window.location.origin}/barang/${selectedQrItem.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    showToast('Tautan QR Unit disalin ke clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadQrPng = () => {
    if (!qrCodeDataUrl || !selectedQrItem) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `QR-${selectedQrItem.kode}.png`;
    link.click();
  };

  const printQrLabel = () => {
    if (!selectedQrItem || !qrCodeDataUrl || typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank', 'width=450,height=550');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label QR Code - ${selectedQrItem.kode}</title>
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
            <div class="header-title">INVENTARIS ASET SEKOLAH · ${selectedQrItem.jurusan || 'SMK'}</div>
            <div class="item-code">${selectedQrItem.kode}</div>
            <div class="item-name">${selectedQrItem.nama}</div>
            <img src="${qrCodeDataUrl}" class="qr-image" alt="QR Code" />
            <div class="meta-grid">
              <div><strong>Ruangan:</strong> ${selectedQrItem.ruangan || '-'}</div>
              <div><strong>Kondisi:</strong> ${selectedQrItem.kondisi}</div>
              <div><strong>Nomor Seri:</strong> ${selectedQrItem.nomor_seri || '-'}</div>
              <div><strong>Tahun:</strong> ${selectedQrItem.tahun_perolehan || '-'}</div>
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

  const hasActiveFilters =
    searchTerm || filterJurusan !== 'all' || filterKondisi !== 'all' || filterStatus !== 'all';

  const resetAllFilters = () => {
    setSearchTerm('');
    setFilterJurusan('all');
    setFilterKondisi('all');
    setFilterStatus('all');
  };

  return (
    <div className="space-y-4">
      {/* ============================================================ */}
      {/* 1. DATATABLES TOP CONTROLS & TOOLBAR */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Entries Per Page Selector (Show [10] entries) */}
          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-medium whitespace-nowrap">Tampilkan</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="font-medium whitespace-nowrap">data per halaman</span>
          </div>

          {/* Search Box & Quick Filter Toggle */}
          <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kode unit, jenis, nama, ruangan, dsb..."
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-0.5"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-2.5 py-1.5 border text-xs font-medium rounded-sm flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-700'
              }`}
              title="Filter Lanjutan"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-sm transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              title="Muat ulang data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expandable Filter Row */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Jurusan Filter (Only active/changeable for Super Admin & non-scoped) */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Filter Jurusan
              </label>
              {isLaboranOrKakom && currentUser?.jurusan_kode ? (
                <div className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {currentUser.jurusan_kode} (Terkunci Otomatis)
                </div>
              ) : (
                <select
                  value={filterJurusan}
                  onChange={(e) => setFilterJurusan(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                >
                  <option value="all">Semua Jurusan (RPL, ATPH, TBSM)</option>
                  <option value="RPL">RPL (Rekayasa Perangkat Lunak)</option>
                  <option value="ATPH">ATPH (Agribisnis Tanaman Pangan)</option>
                  <option value="TBSM">TBSM (Teknik Bisnis Sepeda Motor)</option>
                </select>
              )}
            </div>

            {/* Kondisi Filter */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Filter Kondisi
              </label>
              <select
                value={filterKondisi}
                onChange={(e) => setFilterKondisi(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              >
                <option value="all">Semua Kondisi</option>
                <option value="BAIK">Baik</option>
                <option value="RUSAK_RINGAN">Rusak Ringan</option>
                <option value="RUSAK_BERAT">Rusak Berat</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Filter Status Unit
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              >
                <option value="all">Semua Status</option>
                <option value="TERSEDIA">Tersedia</option>
                <option value="DIPINJAM">Dipinjam</option>
                <option value="PERBAIKAN">Perbaikan / Perawatan</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-3 flex justify-end pt-1">
                <button
                  onClick={resetAllFilters}
                  className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. ERROR STATE */}
      {/* ============================================================ */}
      {isError && (
        <div className="p-4 border border-red-200 dark:border-red-900/60 rounded-sm bg-red-50/50 dark:bg-red-950/20 text-center space-y-2">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            Gagal mengambil data inventori dari server.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MAIN DATATABLES TABLE WITH HORIZONTAL SCROLLING */}
      {/* ============================================================ */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-sm bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
        {/* Horizontal scroll wrapper (scrollX: true) */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold select-none">
                {/* No Column */}
                <th className="py-3 px-3 w-12 text-center text-neutral-500 font-medium">No</th>

                {/* Kode Unit (Sortable) */}
                <th
                  onClick={() => handleSort('kode')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800 transition-colors group"
                >
                  <div className="flex items-center gap-1">
                    <span>Kode Unit</span>
                    {renderSortIndicator('kode')}
                  </div>
                </th>

                {/* Jenis Barang (Sortable) */}
                <th
                  onClick={() => handleSort('kode_kelompok')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800 transition-colors group"
                >
                  <div className="flex items-center gap-1">
                    <span>Jenis Barang</span>
                    {renderSortIndicator('kode_kelompok')}
                  </div>
                </th>

                {/* Nama Barang (Sortable) */}
                <th
                  onClick={() => handleSort('nama')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800 transition-colors group min-w-[180px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Nama Barang</span>
                    {renderSortIndicator('nama')}
                  </div>
                </th>

                {/* Jurusan (Sortable) */}
                <th
                  onClick={() => handleSort('jurusan')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800 transition-colors group text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Jurusan</span>
                    {renderSortIndicator('jurusan')}
                  </div>
                </th>

                {/* Ruangan (Sortable) */}
                <th
                  onClick={() => handleSort('ruangan')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800 transition-colors group"
                >
                  <div className="flex items-center gap-1">
                    <span>Ruangan</span>
                    {renderSortIndicator('ruangan')}
                  </div>
                </th>

                {/* Kondisi (Sortable) */}
                <th
                  onClick={() => handleSort('kondisi')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800 transition-colors group text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Kondisi</span>
                    {renderSortIndicator('kondisi')}
                  </div>
                </th>

                {/* Status (Sortable) */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800 transition-colors group text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    {renderSortIndicator('status')}
                  </div>
                </th>

                {/* QR Code Column (Non-Sortable) */}
                <th className="py-3 px-3 text-center w-16">
                  <span>QR</span>
                </th>

                {/* Aksi Column (Non-Sortable) */}
                <th className="py-3 px-4 text-right min-w-[160px]">
                  <span>Aksi</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70">
              {/* Loading Skeleton State */}
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-3 px-3 text-center">
                      <div className="h-3 w-4 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-40 bg-neutral-200 dark:bg-neutral-800 rounded mb-1" />
                      <div className="h-2.5 w-20 bg-neutral-100 dark:bg-neutral-800/60 rounded" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-28 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="h-4 w-14 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="h-6 w-6 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : currentPaginatedItems.length === 0 ? (
                /* Empty State in DataTables */
                <tr>
                  <td colSpan={10} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-2.5">
                      <div className="w-10 h-10 rounded-sm bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mx-auto">
                        <Package className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        {hasActiveFilters
                          ? 'Tidak ada data barang yang sesuai'
                          : 'Belum ada data barang'}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {hasActiveFilters
                          ? 'Tidak ditemukan data yang cocok dengan kriteria pencarian dan filter yang aktif.'
                          : 'Data unit inventaris barang fisik belum terdaftar di sistem.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetAllFilters}
                          className="px-3 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-sm text-xs font-medium cursor-pointer"
                        >
                          Reset Pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                /* Data Rows */
                currentPaginatedItems.map((item, idx) => {
                  const absoluteNo = startIndex + idx + 1;
                  const canModify = canModifyItem(item);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* 1. No */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-neutral-400">
                        {absoluteNo}
                      </td>

                      {/* 2. Kode Unit */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="font-mono font-bold text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left cursor-pointer"
                            title="Klik untuk lihat detail unit"
                          >
                            {item.kode}
                          </button>
                          {item.nomor_unit && (
                            <span className="text-[10px] font-mono text-neutral-400">
                              #{item.nomor_unit}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Jenis Barang */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.kode_kelompok ? (
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                            {item.kode_kelompok}
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-mono text-[11px]">-</span>
                        )}
                      </td>

                      {/* 4. Nama Barang */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="font-semibold text-neutral-900 dark:text-white hover:underline text-left block cursor-pointer"
                          >
                            {item.nama}
                          </button>
                          {(item.merk || item.tipe || item.nomor_seri) && (
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 flex-wrap">
                              {item.merk && <span>{item.merk}</span>}
                              {item.tipe && <span>({item.tipe})</span>}
                              {item.nomor_seri && (
                                <span className="font-mono text-[10px] text-neutral-400">
                                  SN: {item.nomor_seri}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Jurusan */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.jurusan ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${getJurusanBadge(
                              item.jurusan
                            )}`}
                          >
                            {item.jurusan}
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-mono text-[11px]">-</span>
                        )}
                      </td>

                      {/* 6. Ruangan */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.ruangan ? (
                          <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 font-medium">
                            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span>{item.ruangan}</span>
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic text-[11px]">Belum ditentukan</span>
                        )}
                      </td>

                      {/* 7. Kondisi */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-sm border inline-block ${getKondisiBadge(
                            item.kondisi
                          )}`}
                        >
                          {item.kondisi}
                        </span>
                      </td>

                      {/* 8. Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border inline-block ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status || 'TERSEDIA'}
                        </span>
                      </td>

                      {/* 9. QR Code */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedQrItem(item)}
                          className="p-1.5 rounded-sm border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title={`Buka QR Code unit ${item.kode}`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* 10. Aksi (Permission Enforced) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Detail Button */}
                          <button
                            onClick={() => setDetailItem(item)}
                            className="h-7 px-2 text-xs font-medium border border-neutral-200 dark:border-neutral-700 rounded-sm bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Lihat Detail Unit"
                          >
                            <Eye className="w-3 h-3 text-neutral-400" />
                            <span>Detail</span>
                          </button>

                          {/* Edit Button (Role & Scope Protected) */}
                          {canModify && (
                            <Link href={`/barang/${item.id}/edit`}>
                              <button
                                className="h-7 px-2 text-xs font-medium border border-neutral-200 dark:border-neutral-700 rounded-sm bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Edit Data Unit"
                              >
                                <Edit2 className="w-3 h-3 text-neutral-400" />
                                <span>Edit</span>
                              </button>
                            </Link>
                          )}

                          {/* Delete Button (Role & Scope Protected) */}
                          {canModify && (
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="h-7 px-2 text-xs font-medium border border-red-200 dark:border-red-900/60 rounded-sm bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100/70 dark:hover:bg-red-900/40 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Hapus Data Unit"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================================ */}
        {/* 4. DATATABLES BOTTOM CONTROLS & PAGINATION */}
        {/* ============================================================ */}
        <div className="px-3.5 py-3 bg-neutral-50 dark:bg-neutral-800/60 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Showing 1 to 10 of 35 entries */}
          <div className="text-neutral-600 dark:text-neutral-400 font-medium">
            {totalEntries === 0 ? (
              <span>Menampilkan 0 dari 0 data</span>
            ) : (
              <span>
                Menampilkan <strong className="text-neutral-900 dark:text-white">{startIndex + 1}</strong> sampai{' '}
                <strong className="text-neutral-900 dark:text-white">{endIndex}</strong> dari{' '}
                <strong className="text-neutral-900 dark:text-white">{totalEntries}</strong> data
                {hasActiveFilters && items.length !== totalEntries && (
                  <span className="text-neutral-400 ml-1">
                    (difilter dari total {items.length} data)
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 self-center sm:self-auto select-none">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-0.5"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers().map((p, pIdx) => {
                  if (typeof p === 'string') {
                    return (
                      <span
                        key={`ellipsis-${pIdx}`}
                        className="px-1.5 py-1 text-neutral-400 font-mono text-xs"
                      >
                        ...
                      </span>
                    );
                  }

                  const isActive = p === currentPage;
                  return (
                    <button
                      key={`page-${p}`}
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[28px] h-7 px-2 rounded-sm text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-2xs'
                          : 'border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-0.5"
                title="Halaman Selanjutnya"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. INTERACTIVE QR CODE MODAL FOR PHYSICAL ASSET UNIT */}
      {/* ============================================================ */}
      <Dialog
        isOpen={Boolean(selectedQrItem)}
        onClose={() => setSelectedQrItem(null)}
        title="QR Code Unit Fisik"
        description={`QR Code khusus untuk identifikasi unit ${selectedQrItem?.kode}.`}
      >
        {selectedQrItem && (
          <div className="space-y-4 text-center">
            {/* Unit Identity Header */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-sm text-left">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                  {selectedQrItem.kode}
                </span>
                {selectedQrItem.jurusan && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${getJurusanBadge(selectedQrItem.jurusan)}`}>
                    {selectedQrItem.jurusan}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mt-1">
                {selectedQrItem.nama}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Ruangan: {selectedQrItem.ruangan || '-'} · Kondisi: {selectedQrItem.kondisi}
              </p>
            </div>

            {/* QR Image Box */}
            <div className="p-3 bg-white rounded-md border border-neutral-200 dark:border-neutral-700 shadow-xs inline-block mx-auto">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code ${selectedQrItem.kode}`}
                  className="w-48 h-48 object-contain mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-neutral-400">
                  Membuat QR...
                </div>
              )}
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
              Scan dengan kamera smartphone untuk langsung membuka lembar detail unit, status riil, dan riwayat pemeliharaan.
            </p>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQrPng}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Unduh PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyQrLink}
                leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {isCopied ? 'Tersalin!' : 'Salin URL'}
              </Button>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={printQrLabel}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Cetak Label Fisik QR
            </Button>
          </div>
        )}
      </Dialog>

      {/* ============================================================ */}
      {/* 6. QUICK DETAIL MODAL (UNIT DETAIL & HISTORIES) */}
      {/* ============================================================ */}
      <Dialog
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        title="Detail Unit Barang Fisik"
        description={`Informasi spesifikasi lengkap unit ${detailItem?.kode}.`}
        className="max-w-2xl"
      >
        {detailItem && (
          <div className="space-y-4 text-xs">
            {/* Top Specification Card */}
            <div className="p-3.5 rounded-sm bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-neutral-200 dark:border-neutral-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                      {detailItem.kode}
                    </span>
                    {detailItem.kode_kelompok && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                        Kelompok: {detailItem.kode_kelompok}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                    {detailItem.nama}
                  </h3>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${getStatusBadge(detailItem.status)}`}>
                    {detailItem.status || 'TERSEDIA'}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-sm border ${getKondisiBadge(detailItem.kondisi)}`}>
                    Kondisi: {detailItem.kondisi}
                  </span>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-neutral-600 dark:text-neutral-300">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Jurusan</span>
                  <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Layers className="w-3 h-3 text-neutral-400" />
                    {detailItem.jurusan || 'Umum'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 block">Ruangan</span>
                  <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    {detailItem.ruangan || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 block">Merk / Tipe</span>
                  <span className="font-semibold text-neutral-900 dark:text-white block mt-0.5">
                    {detailItem.merk ? `${detailItem.merk} ${detailItem.tipe || ''}`.trim() : '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 block">Nomor Seri (SN)</span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-neutral-400" />
                    {detailItem.nomor_seri || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 block">Tahun / Sumber Dana</span>
                  <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-neutral-400" />
                    {detailItem.tahun_perolehan || '-'} · {detailItem.sumber_dana || 'BOS'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 block">Harga Perolehan</span>
                  <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <DollarSign className="w-3 h-3 text-neutral-400" />
                    {detailItem.harga_perolehan ? `Rp ${detailItem.harga_perolehan.toLocaleString('id-ID')}` : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Riwayat Perawatan & Peminjaman Tabs/Sections */}
            {detailLoading ? (
              <div className="py-6 text-center text-neutral-400">Memuat riwayat unit...</div>
            ) : (
              <div className="space-y-3">
                {/* Riwayat Perawatan */}
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                    <Wrench className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Riwayat Perawatan ({fullAssetDetail?.maintenances.length || 0})
                  </h4>
                  {!fullAssetDetail?.maintenances || fullAssetDetail.maintenances.length === 0 ? (
                    <p className="text-[11px] text-neutral-400 italic">Belum ada catatan perawatan untuk unit ini.</p>
                  ) : (
                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-sm overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          <tr>
                            <th className="p-2">Tanggal</th>
                            <th className="p-2">Jenis Perawatan</th>
                            <th className="p-2">Teknisi</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                          {fullAssetDetail.maintenances.map((m) => (
                            <tr key={m.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                              <td className="p-2 font-mono">{m.tanggal_perawatan}</td>
                              <td className="p-2 font-medium">{m.jenis_perawatan}</td>
                              <td className="p-2">{m.pelaksana}</td>
                              <td className="p-2">
                                <span className="font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Riwayat Peminjaman */}
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Riwayat Peminjaman ({fullAssetDetail?.borrowings.length || 0})
                  </h4>
                  {!fullAssetDetail?.borrowings || fullAssetDetail.borrowings.length === 0 ? (
                    <p className="text-[11px] text-neutral-400 italic">Belum ada riwayat peminjaman untuk unit ini.</p>
                  ) : (
                    <div className="border border-neutral-200 dark:border-neutral-700 rounded-sm overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          <tr>
                            <th className="p-2">No. Pengajuan</th>
                            <th className="p-2">Peminjam</th>
                            <th className="p-2">Periode</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                          {fullAssetDetail.borrowings.map((b) => (
                            <tr key={b.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                              <td className="p-2 font-mono text-blue-600 dark:text-blue-400">{b.nomor_pengajuan}</td>
                              <td className="p-2 font-medium">{b.user_name}</td>
                              <td className="p-2 font-mono">{b.tanggal_peminjaman} s/d {b.tanggal_pengembalian_rencana}</td>
                              <td className="p-2">
                                <span className="font-bold text-[10px] text-neutral-700 dark:text-neutral-300">
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Navigation */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailItem(null)}
              >
                Tutup
              </Button>
              <Link href={`/barang/${detailItem.id}`}>
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Buka Halaman Lengkap
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Dialog>

      {/* ============================================================ */}
      {/* 7. DELETE CONFIRMATION DIALOG */}
      {/* ============================================================ */}
      <Dialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Unit Barang?"
        description={`Apakah Anda yakin ingin menghapus unit fisik "${deleteTarget?.nama}" (${deleteTarget?.kode})? Tindakan ini tidak dapat dibatalkan.`}
        variant="danger"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
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
        {deleteTarget && (
          <div className="p-2.5 rounded-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
            <p className="font-semibold text-neutral-900 dark:text-white">
              {deleteTarget.nama}
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              {deleteTarget.kode} · Jurusan {deleteTarget.jurusan || 'Umum'} · {deleteTarget.ruangan || 'Tanpa Ruangan'}
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}
