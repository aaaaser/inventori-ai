'use client';

import React, { useState, useEffect } from 'react';
import { Barang, BarangFormData, UserSession, RoomData } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { validateBarangInput } from '@/lib/validation';
import { Layers, MapPin, Tag, Calendar, DollarSign, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

interface BarangFormProps {
  initialData?: Barang;
  onSubmit: (data: BarangFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const KONDISI_OPTIONS = [
  { value: 'Baik', label: 'Baik' },
  { value: 'Rusak Ringan', label: 'Rusak Ringan' },
  { value: 'Rusak Berat', label: 'Rusak Berat' },
];

export const BarangForm: React.FC<BarangFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [roomList, setRoomList] = useState<RoomData[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);

  const [formData, setFormData] = useState<BarangFormData>({
    kode: initialData?.kode || '',
    nama: initialData?.nama || '',
    jumlah: initialData?.jumlah ?? 1,
    kondisi: initialData?.kondisi || 'Baik',
    jurusan: initialData?.jurusan || 'RPL',
    jurusan_id: initialData?.jurusan === 'ATPH' ? 2 : initialData?.jurusan === 'TBSM' ? 3 : 1,
    ruangan: initialData?.ruangan || '',
    ruangan_id: undefined,
    merk: initialData?.merk || '',
    tipe: initialData?.tipe || '',
    tahun_perolehan: initialData?.tahun_perolehan || new Date().getFullYear(),
    sumber_dana: initialData?.sumber_dana || 'Dana BOS',
    harga_perolehan: initialData?.harga_perolehan || 0,
    keterangan: initialData?.keterangan || '',
  });

  const [predictedCode, setPredictedCode] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch current user
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (data.user.jurusan_kode) {
            const jurKode = data.user.jurusan_kode;
            const jurId = data.user.jurusan_id || (jurKode === 'ATPH' ? 2 : jurKode === 'TBSM' ? 3 : 1);
            setFormData((prev) => ({
              ...prev,
              jurusan: jurKode,
              jurusan_id: jurId,
            }));
          }
        }
      })
      .catch((err) => console.error('Error fetching me:', err));
  }, []);

  // Fetch dynamic rooms whenever jurusan changes
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsRoomsLoading(true);
        let jurId = formData.jurusan_id;
        if (!jurId && formData.jurusan) {
          jurId = formData.jurusan === 'ATPH' ? 2 : formData.jurusan === 'TBSM' ? 3 : 1;
        }

        const res = await fetch(`/api/rooms?active_only=true${jurId ? `&jurusan_id=${jurId}` : ''}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setRoomList(data.data);
          // Set default room if none chosen or current room not in list
          if (data.data.length > 0) {
            const currentMatching = data.data.find(
              (r: RoomData) => (r.nama_ruangan || r.name) === formData.ruangan || r.id === formData.ruangan_id
            );
            if (!currentMatching) {
              setFormData((prev) => ({
                ...prev,
                ruangan: data.data[0].nama_ruangan || data.data[0].name,
                ruangan_id: data.data[0].id,
              }));
            }
          }
        }
      } catch (e) {
        console.error('Error fetching rooms:', e);
      } finally {
        setIsRoomsLoading(false);
      }
    };

    fetchRooms();
  }, [formData.jurusan, formData.jurusan_id]);

  // Fetch next predicted group code
  useEffect(() => {
    if (formData.jurusan && !initialData) {
      fetch(`/api/asset-groups?nextCodeFor=${formData.jurusan}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.nextCode) {
            setPredictedCode(data.nextCode);
            setFormData((prev) => ({
              ...prev,
              kode: `${data.nextCode}-001`,
            }));
          }
        })
        .catch((err) => console.error('Error predicting code:', err));
    }
  }, [formData.jurusan, initialData]);

  const handleChange = (field: keyof BarangFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleJurusanChange = (val: string) => {
    const jurId = val === 'ATPH' ? 2 : val === 'TBSM' ? 3 : 1;
    setFormData((prev) => ({
      ...prev,
      jurusan: val,
      jurusan_id: jurId,
      ruangan: '',
      ruangan_id: undefined,
    }));
  };

  const handleRoomSelect = (roomIdStr: string) => {
    const rId = parseInt(roomIdStr, 10);
    const selected = roomList.find((r) => r.id === rId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        ruangan_id: selected.id,
        ruangan: selected.nama_ruangan || selected.name,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitPayload: BarangFormData = {
      ...formData,
    };

    const validation = validateBarangInput(submitPayload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSubmit(submitPayload);
    } catch (err: any) {
      if (err?.errors) {
        setErrors(err.errors);
      }
    }
  };

  const isDepartmentLocked =
    currentUser?.role === 'KAKOM' || currentUser?.role === 'LABORAN';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Scope info */}
      {isDepartmentLocked && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-sm text-xs flex items-center justify-between">
          <span className="text-blue-800 dark:text-blue-300 font-medium">
            Terkunci pada Jurusan {currentUser?.jurusan_kode} ({currentUser?.role})
          </span>
          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
            Data scope aktif · Jurusan otomatis terisi
          </span>
        </div>
      )}

      {/* Jurusan & Ruangan Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Select
            label="Jurusan Pemilik"
            value={formData.jurusan || 'RPL'}
            onChange={(e) => handleJurusanChange(e.target.value)}
            options={[
              { value: 'RPL', label: 'RPL · Rekayasa Perangkat Lunak' },
              { value: 'ATPH', label: 'ATPH · Agribisnis Tanaman Pangan & Hortikultura' },
              { value: 'TBSM', label: 'TBSM · Teknik & Bisnis Sepeda Motor' },
            ]}
            disabled={isLoading || isDepartmentLocked}
            required
          />
        </div>

        <div>
          <label className="block text-xs text-neutral-700 dark:text-neutral-300 font-medium mb-1">
            Ruangan / Lokasi Penempatan (Dinamis)
          </label>
          {roomList.length > 0 ? (
            <select
              value={formData.ruangan_id || (roomList.find(r => (r.nama_ruangan || r.name) === formData.ruangan)?.id ?? '')}
              onChange={(e) => handleRoomSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 disabled:opacity-50"
              disabled={isLoading || isRoomsLoading}
              required
            >
              {roomList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama_ruangan || r.name} {r.kode_ruangan ? `(${r.kode_ruangan})` : ''} {r.lokasi ? `— ${r.lokasi}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <Input
              placeholder="Contoh: Lab Komputer RPL 1"
              value={formData.ruangan || ''}
              onChange={(e) => handleChange('ruangan', e.target.value)}
              error={errors.ruangan}
              required
              disabled={isLoading}
            />
          )}
          {errors.ruangan && (
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">{errors.ruangan}</p>
          )}
        </div>
      </div>

      {/* Nama Barang */}
      <div>
        <Input
          label="Nama Jenis / Kelompok Barang"
          placeholder="Contoh: Komputer Server, Mikroskop Digital, Mesin Dyno, Traktor Tangan"
          value={formData.nama}
          onChange={(e) => handleChange('nama', e.target.value)}
          error={errors.nama}
          helperText="Nama umum barang. Kode kelompok (BRG-[JURUSAN]-XXX) akan otomatis dibuatkan."
          required
          disabled={isLoading}
        />
      </div>

      {/* Merk & Model/Tipe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Input
            label="Merk / Brand (Opsional)"
            placeholder="Contoh: Dell, Honda, Olympus, Epson"
            value={formData.merk || ''}
            onChange={(e) => handleChange('merk', e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div>
          <Input
            label="Tipe / Model (Opsional)"
            placeholder="Contoh: PowerEdge T40, CBR150R, CX23"
            value={formData.tipe || ''}
            onChange={(e) => handleChange('tipe', e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Jumlah Unit & Kondisi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Input
            label="Jumlah Unit Fisik yang Didaftarkan"
            type="number"
            min={1}
            max={500}
            value={formData.jumlah}
            onChange={(e) => handleChange('jumlah', parseInt(e.target.value, 10) || 1)}
            error={errors.jumlah}
            helperText="Setiap unit akan otomatis mendapatkan kode unik (contoh: -001, -002, dst.)"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Select
            label="Kondisi Fisik Unit"
            value={formData.kondisi}
            onChange={(e) => handleChange('kondisi', e.target.value)}
            options={KONDISI_OPTIONS}
            error={errors.kondisi}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Automated Code Preview Helper */}
      {predictedCode && (
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-sm text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Format Kode Otomatis:</span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Kode Kelompok Jenis:{' '}
            <strong className="font-mono text-neutral-900 dark:text-white">
              {predictedCode}
            </strong>
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">
            Kode Unit Fisik yang Dihasilkan:{' '}
            <span className="font-mono text-neutral-900 dark:text-white font-medium">
              {predictedCode}-001
              {formData.jumlah > 1 ? ` s/d ${predictedCode}-${String(formData.jumlah).padStart(3, '0')}` : ''}
            </span>
          </p>
        </div>
      )}

      {/* Financial & Procurement Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Input
            label="Tahun Perolehan"
            type="number"
            min={1990}
            max={2099}
            value={formData.tahun_perolehan || new Date().getFullYear()}
            onChange={(e) => handleChange('tahun_perolehan', parseInt(e.target.value, 10) || new Date().getFullYear())}
            disabled={isLoading}
          />
        </div>

        <div>
          <Input
            label="Sumber Dana"
            placeholder="Dana BOS, DAK, Hibah, Komite"
            value={formData.sumber_dana || 'Dana BOS'}
            onChange={(e) => handleChange('sumber_dana', e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <Input
            label="Harga Perolehan Satuan (Rp)"
            type="number"
            min={0}
            placeholder="0"
            value={formData.harga_perolehan || 0}
            onChange={(e) => handleChange('harga_perolehan', parseInt(e.target.value, 10) || 0)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Keterangan */}
      <div>
        <label className="block text-xs text-neutral-700 dark:text-neutral-300 font-medium mb-1">
          Keterangan / Catatan Tambahan (Opsional)
        </label>
        <textarea
          className="w-full px-3 py-2 text-xs rounded-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          rows={2}
          placeholder="Spesifikasi teknis tambahan, kelengkapan aksesoris, dll."
          value={formData.keterangan || ''}
          onChange={(e) => handleChange('keterangan', e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isLoading}
        >
          {initialData ? 'Simpan Perubahan' : 'Daftarkan Barang & Generate Unit'}
        </Button>
      </div>
    </form>
  );
};

