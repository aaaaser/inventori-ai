'use client';

import React, { useState } from 'react';
import { Barang, BarangFormData } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { validateBarangInput } from '@/lib/validation';

interface BarangFormProps {
  initialData?: Barang;
  onSubmit: (data: BarangFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DEFAULT_KATEGORI = [
  'Elektronik',
  'Komputer & IT',
  'Furniture',
  'Peralatan Kantor',
  'Alat Tulis',
  'Kendaraan & Mesin',
  'Lainnya',
];

const KONDISI_OPTIONS = [
  { value: 'Baru', label: 'Baru' },
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
  const [formData, setFormData] = useState<BarangFormData>({
    kode: initialData?.kode || '',
    nama: initialData?.nama || '',
    kategori: initialData?.kategori || 'Elektronik',
    jumlah: initialData?.jumlah ?? 1,
    kondisi: initialData?.kondisi || 'Baik',
  });

  const [customKategori, setCustomKategori] = useState(
    initialData && !DEFAULT_KATEGORI.includes(initialData.kategori) ? initialData.kategori : ''
  );
  const [isCustomKategori, setIsCustomKategori] = useState(
    Boolean(initialData && !DEFAULT_KATEGORI.includes(initialData.kategori))
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleKategoriSelect = (val: string) => {
    if (val === 'CUSTOM') {
      setIsCustomKategori(true);
      handleChange('kategori', customKategori || '');
    } else {
      setIsCustomKategori(false);
      handleChange('kategori', val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalKategori = isCustomKategori ? customKategori.trim() : formData.kategori;
    const submitPayload: BarangFormData = {
      ...formData,
      kategori: finalKategori,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Kode Barang */}
      <div>
        <Input
          label="Kode Barang"
          placeholder="Contoh: LP-001, BRG-002"
          value={formData.kode}
          onChange={(e) => handleChange('kode', e.target.value.toUpperCase())}
          error={errors.kode}
          helperText="Kode unik untuk identifikasi barang"
          required
          disabled={isLoading}
        />
      </div>

      {/* Nama Barang */}
      <div>
        <Input
          label="Nama Barang"
          placeholder="Contoh: Laptop Lenovo ThinkPad T14s"
          value={formData.nama}
          onChange={(e) => handleChange('nama', e.target.value)}
          error={errors.nama}
          required
          disabled={isLoading}
        />
      </div>

      {/* Kategori */}
      <div className="space-y-2">
        <Select
          label="Kategori"
          value={isCustomKategori ? 'CUSTOM' : formData.kategori}
          onChange={(e) => handleKategoriSelect(e.target.value)}
          options={[
            ...DEFAULT_KATEGORI.map((k) => ({ value: k, label: k })),
            { value: 'CUSTOM', label: '+ Kategori Lainnya...' },
          ]}
          error={!isCustomKategori ? errors.kategori : undefined}
          required
          disabled={isLoading}
        />

        {isCustomKategori && (
          <Input
            placeholder="Tulis nama kategori baru"
            value={customKategori}
            onChange={(e) => {
              setCustomKategori(e.target.value);
              handleChange('kategori', e.target.value);
            }}
            error={errors.kategori}
            disabled={isLoading}
          />
        )}
      </div>

      {/* Grid: Jumlah & Kondisi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            type="number"
            min="0"
            step="1"
            label="Jumlah (Unit)"
            placeholder="0"
            value={formData.jumlah}
            onChange={(e) => handleChange('jumlah', e.target.value)}
            error={errors.jumlah}
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Select
            label="Kondisi"
            value={formData.kondisi}
            onChange={(e) => handleChange('kondisi', e.target.value)}
            options={KONDISI_OPTIONS}
            error={errors.kondisi}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Form Buttons */}
      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Batal
        </Button>

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {initialData ? 'Simpan Perubahan' : 'Simpan Barang'}
        </Button>
      </div>
    </form>
  );
};
