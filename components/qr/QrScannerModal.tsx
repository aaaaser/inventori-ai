'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Search,
  ArrowRight,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (asset: any) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();

  // Mode: 'camera' or 'manual'
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');

  // Scanner status
  const [scannerState, setScannerState] = useState<
    'idle' | 'initializing' | 'scanning' | 'processing' | 'success' | 'error' | 'permission_denied' | 'camera_unavailable'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<string>('');

  // Camera devices & controls
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  // Manual input form
  const [manualCode, setManualCode] = useState<string>('');
  const [isManualSubmitting, setIsManualSubmitting] = useState<boolean>(false);

  // Html5Qrcode instance reference
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const scannerElementId = 'qr-reader-viewport';

  // Stop scanner safely
  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn('Error during scanner stop:', err);
    } finally {
      html5QrCodeRef.current = null;
    }
  };

  // Handle closing modal
  const handleClose = async () => {
    await stopScanner();
    setScannerState('idle');
    setErrorMessage('');
    setStatusMessage('');
    setScannedResult('');
    isProcessingRef.current = false;
    onClose();
  };

  // Process scanned code via backend verification
  const processQrCode = async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setScannerState('processing');
    setScannedResult(decodedText);
    setStatusMessage('QR Code terdeteksi. Memvalidasi unit barang...');

    // Stop scanner camera immediately to prevent multiple scans
    await stopScanner();

    try {
      const res = await fetch('/api/assets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: decodedText }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setScannerState('success');
        setStatusMessage('QR Code berhasil dibaca. Membuka detail barang...');

        if (onSuccess) {
          onSuccess(data.data);
        }

        // Slight pause for clear visual confirmation
        setTimeout(() => {
          handleClose();
          router.push(data.data.detailUrl || `/barang/${data.data.id}`);
        }, 600);
      } else {
        setScannerState('error');
        if (res.status === 403) {
          setErrorMessage(
            data.message || 'Akses Ditolak: Anda tidak memiliki izin untuk melihat aset jurusan ini.'
          );
        } else if (res.status === 404) {
          setErrorMessage('Barang tidak ditemukan. QR Code tidak terdaftar pada sistem.');
        } else {
          setErrorMessage(data.message || 'Gagal memproses QR Code.');
        }
      }
    } catch (err: any) {
      console.error('Scan processing error:', err);
      setScannerState('error');
      setErrorMessage('Terjadi kesalahan koneksi ke server. Silakan coba lagi.');
    }
  };

  // Initialize and start scanner
  const startScanner = async () => {
    if (typeof window === 'undefined') return;

    // Check secure context
    if (
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      console.warn('Camera access requires HTTPS or localhost');
    }

    try {
      setScannerState('initializing');
      setErrorMessage('');
      setStatusMessage('Menyiapkan kamera...');
      isProcessingRef.current = false;

      // Clean up previous instance if any
      await stopScanner();

      // Get available cameras
      let videoInputDevices: Array<{ id: string; label: string }> = [];
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          videoInputDevices = devices.map((d) => ({ id: d.id, label: d.label || `Kamera ${d.id.slice(0, 5)}` }));
          setCameras(videoInputDevices);
        }
      } catch (camErr: any) {
        console.warn('Could not enumerate cameras prior to permission:', camErr);
      }

      const html5QrCode = new Html5Qrcode(scannerElementId);
      html5QrCodeRef.current = html5QrCode;

      const config: Html5QrcodeCameraScanConfig = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.72);
          return {
            width: Math.max(200, Math.min(qrboxSize, 280)),
            height: Math.max(200, Math.min(qrboxSize, 280)),
          };
        },
        aspectRatio: 1.0,
      };

      // Camera selection strategy: back camera (environment) first
      let cameraConfig: any = { facingMode: 'environment' };
      if (selectedCameraId) {
        cameraConfig = { deviceId: { exact: selectedCameraId } };
      }

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          // Success callback
          processQrCode(decodedText);
        },
        (_errorMessage) => {
          // Frame error (normal when QR is not yet in view)
        }
      );

      setScannerState('scanning');
      setStatusMessage('Arahkan kamera ke QR Code unit barang.');

      // Check torch capability
      try {
        const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
        if (capabilities && capabilities.torchFeature().isSupported()) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      await stopScanner();

      const errMsg = String(err?.message || err || '').toLowerCase();
      const errName = String(err?.name || '').toLowerCase();

      if (
        errMsg.includes('permission') ||
        errMsg.includes('notallowederror') ||
        errName.includes('notallowederror') ||
        errMsg.includes('denied')
      ) {
        setScannerState('permission_denied');
        setErrorMessage(
          'Kamera tidak dapat digunakan. Silakan izinkan akses kamera pada browser kemudian coba kembali.'
        );
      } else if (
        errMsg.includes('notfounderror') ||
        errMsg.includes('devices not found') ||
        errMsg.includes('no camera') ||
        errName.includes('notfounderror')
      ) {
        setScannerState('camera_unavailable');
        setErrorMessage('Kamera tidak tersedia pada perangkat ini.');
      } else {
        setScannerState('camera_unavailable');
        setErrorMessage(
          'Kamera tidak dapat diakses. Pastikan browser memiliki izin kamera atau gunakan fitur Input Manual.'
        );
      }
    }
  };

  // Toggle flashlight / torch
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextState = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Failed to toggle torch:', err);
    }
  };

  // Handle Manual Code Submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setIsManualSubmitting(true);
    await processQrCode(manualCode.trim());
    setIsManualSubmitting(false);
  };

  // Lifecycle when modal opens/closes or changes tab
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, activeTab, selectedCameraId]);

  if (!isOpen) return null;

  return (
    <div
      id="qr-scanner-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
    >
      <div
        id="qr-scanner-modal-content"
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm shadow-xl flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 id="qr-scanner-title" className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
                SCAN QR CODE BARANG
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Pindai QR unit aset fisik sekolah
              </p>
            </div>
          </div>

          <button
            id="btn-close-scanner-header"
            onClick={handleClose}
            className="p-1.5 rounded-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Tutup Scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switch Tabs (Kamera vs Input Manual) */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-1 text-xs">
          <button
            id="tab-scanner-camera"
            type="button"
            onClick={() => {
              setActiveTab('camera');
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 px-3 rounded-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera Scanner</span>
          </button>

          <button
            id="tab-scanner-manual"
            type="button"
            onClick={() => {
              setActiveTab('manual');
              stopScanner();
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 px-3 rounded-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Input Kode Manual</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {activeTab === 'camera' ? (
            <div className="space-y-3">
              {/* Camera Scanner Container */}
              <div className="relative w-full aspect-square max-h-[300px] bg-neutral-950 rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 flex items-center justify-center">
                {/* HTML5 QR Code viewport container */}
                <div
                  id={scannerElementId}
                  className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                />

                {/* Live Scanner Overlay / Reticle when active */}
                {scannerState === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Viewfinder box with high-contrast corner markers */}
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                      {/* Top-Left Corner */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white" />
                      {/* Top-Right Corner */}
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white" />
                      {/* Bottom-Left Corner */}
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white" />
                      {/* Bottom-Right Corner */}
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white" />

                      {/* Animated Laser Scan Line */}
                      <div className="absolute inset-x-2 top-0 h-0.5 bg-neutral-100 shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-[bounce_2s_infinite]" />
                    </div>
                  </div>
                )}

                {/* State: Initializing Spinner */}
                {scannerState === 'initializing' && (
                  <div className="absolute inset-0 bg-neutral-950/80 flex flex-col items-center justify-center p-4 text-center text-white space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-neutral-300" />
                    <p className="text-xs font-medium text-neutral-200">
                      Mengaktifkan kamera perangkat...
                    </p>
                  </div>
                )}

                {/* State: Processing / Success Overlay */}
                {(scannerState === 'processing' || scannerState === 'success') && (
                  <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-4 text-center text-white space-y-2 z-20">
                    {scannerState === 'processing' ? (
                      <>
                        <RefreshCw className="w-8 h-8 animate-spin text-white mb-1" />
                        <p className="text-xs font-bold font-mono">
                          QR CODE TERBACA
                        </p>
                        <p className="text-xs text-neutral-300">
                          Memvalidasi data unit ke server...
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-9 h-9 text-emerald-400 mb-1" />
                        <p className="text-xs font-bold font-mono text-emerald-300">
                          VALIDASI BERHASIL
                        </p>
                        <p className="text-xs text-neutral-200">
                          Membuka detail spesifikasi aset...
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* State: Permission Denied */}
                {scannerState === 'permission_denied' && (
                  <div className="absolute inset-0 bg-neutral-900 p-4 flex flex-col items-center justify-center text-center text-white space-y-2 z-20">
                    <div className="w-10 h-10 rounded-sm bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-white">
                      Kamera Tidak Dapat Digunakan
                    </p>
                    <p className="text-[11px] text-neutral-300 max-w-[240px] leading-relaxed">
                      Silakan izinkan akses kamera pada browser kemudian coba kembali.
                    </p>
                    <div className="pt-2 flex flex-col w-full gap-2 max-w-[220px]">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={startScanner}
                        leftIcon={<RefreshCw className="w-3 h-3" />}
                        className="text-xs h-7 w-full"
                      >
                        Coba Lagi
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('manual')}
                        className="text-xs h-7 w-full bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700"
                      >
                        Gunakan Input Manual
                      </Button>
                    </div>
                  </div>
                )}

                {/* State: Camera Unavailable */}
                {scannerState === 'camera_unavailable' && (
                  <div className="absolute inset-0 bg-neutral-900 p-4 flex flex-col items-center justify-center text-center text-white space-y-2 z-20">
                    <div className="w-10 h-10 rounded-sm bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-white">
                      Kamera Tidak Tersedia
                    </p>
                    <p className="text-[11px] text-neutral-300 max-w-[240px] leading-relaxed">
                      Kamera tidak tersedia pada perangkat ini. Silakan gunakan perangkat yang memiliki kamera atau masukkan kode barang secara manual.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveTab('manual')}
                      className="text-xs h-7 mt-2"
                    >
                      Beralih ke Input Manual
                    </Button>
                  </div>
                )}
              </div>

              {/* Status & Error Message Alert Banner */}
              {scannerState === 'error' && errorMessage && (
                <div
                  id="scan-error-alert"
                  className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-sm space-y-2 text-xs text-red-900 dark:text-red-200"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold">Pemeriksaan QR Gagal</p>
                      <p className="text-[11px] leading-relaxed">{errorMessage}</p>
                    </div>
                  </div>

                  {scannedResult && (
                    <div className="p-1.5 bg-white/60 dark:bg-black/30 rounded-xs font-mono text-[10px] break-all border border-red-200/60 dark:border-red-800/40">
                      Kode terbaca: {scannedResult}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startScanner}
                      leftIcon={<RefreshCw className="w-3 h-3" />}
                      className="text-xs h-7"
                    >
                      Scan Ulang
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('manual')}
                      className="text-xs h-7 text-neutral-600 dark:text-neutral-300"
                    >
                      Coba Input Manual
                    </Button>
                  </div>
                </div>
              )}

              {/* Helper text & camera controls */}
              {scannerState === 'scanning' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Arahkan kamera ke QR Code unit barang
                    </span>

                    <div className="flex items-center gap-1">
                      {hasTorch && (
                        <button
                          type="button"
                          onClick={toggleTorch}
                          className={`p-1.5 rounded-sm border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                            isTorchOn
                              ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 text-amber-900'
                              : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 hover:bg-neutral-100'
                          }`}
                          title="Senter / Flash"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {cameras.length > 1 && (
                        <select
                          value={selectedCameraId}
                          onChange={(e) => setSelectedCameraId(e.target.value)}
                          className="text-[11px] py-1 px-1.5 border border-neutral-200 dark:border-neutral-700 rounded-sm bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                        >
                          {cameras.map((cam, idx) => (
                            <option key={cam.id} value={cam.id}>
                              {cam.label || `Kamera ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[11px] text-neutral-500 dark:text-neutral-400">
                    <p className="font-mono text-[10px] text-neutral-700 dark:text-neutral-300 font-semibold mb-0.5">
                      Contoh QR Terdaftar:
                    </p>
                    <p>BRG-RPL-001-001 · BRG-ATPH-001-001 · BRG-TBSM-001-001</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Manual Input Tab */
            <form onSubmit={handleManualSubmit} className="space-y-3.5 py-2">
              <div className="space-y-1">
                <Input
                  label="Kode Unit Barang atau ID Aset"
                  placeholder="Contoh: BRG-RPL-001-001 atau 1"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                  required
                />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Masukkan kode unit fisik (contoh: <span className="font-mono font-medium">BRG-RPL-001-001</span>) atau ID angka aset.
                </p>
              </div>

              {/* Sample Quick-Fill Chips for Demo Convenience */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase font-mono">
                  Contoh Unit Tersedia:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['BRG-RPL-001-001', 'BRG-RPL-001-002', 'BRG-ATPH-001-001', 'BRG-TBSM-001-001'].map(
                    (code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setManualCode(code)}
                        className="px-2 py-0.5 text-[10px] font-mono bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xs border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer"
                      >
                        {code}
                      </button>
                    )
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-sm text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full flex items-center justify-center gap-1.5"
                isLoading={isManualSubmitting}
                disabled={!manualCode.trim()}
              >
                <span>Cari & Buka Detail Unit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Format QR: Unit Fisik</span>
          </div>

          <Button
            id="btn-close-scanner-footer"
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="text-xs h-7.5 px-3"
          >
            Tutup Scanner
          </Button>
        </div>
      </div>
    </div>
  );
};
