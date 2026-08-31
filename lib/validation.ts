export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateBarangInput(data: {
  kode?: any;
  nama?: any;
  kategori?: any;
  jumlah?: any;
  kondisi?: any;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate kode
  if (!data.kode || typeof data.kode !== 'string' || data.kode.trim() === '') {
    errors.kode = 'Kode barang wajib diisi';
  } else if (data.kode.trim().length < 2) {
    errors.kode = 'Kode barang minimal 2 karakter';
  } else if (data.kode.trim().length > 50) {
    errors.kode = 'Kode barang maksimal 50 karakter';
  }

  // Validate nama
  if (!data.nama || typeof data.nama !== 'string' || data.nama.trim() === '') {
    errors.nama = 'Nama barang wajib diisi';
  } else if (data.nama.trim().length < 2) {
    errors.nama = 'Nama barang minimal 2 karakter';
  } else if (data.nama.trim().length > 200) {
    errors.nama = 'Nama barang maksimal 200 karakter';
  }

  // Validate kategori
  if (!data.kategori || typeof data.kategori !== 'string' || data.kategori.trim() === '') {
    errors.kategori = 'Kategori wajib diisi';
  }

  // Validate jumlah
  if (data.jumlah === undefined || data.jumlah === null || data.jumlah === '') {
    errors.jumlah = 'Jumlah barang wajib diisi';
  } else {
    const num = Number(data.jumlah);
    if (isNaN(num)) {
      errors.jumlah = 'Jumlah harus berupa angka';
    } else if (!Number.isInteger(num)) {
      errors.jumlah = 'Jumlah harus bilangan bulat';
    } else if (num < 0) {
      errors.jumlah = 'Jumlah tidak boleh negatif';
    }
  }

  // Validate kondisi
  const validKondisi = ['Baru', 'Baik', 'Rusak Ringan', 'Rusak Berat'];
  if (!data.kondisi || typeof data.kondisi !== 'string' || data.kondisi.trim() === '') {
    errors.kondisi = 'Kondisi barang wajib dipilih';
  } else if (!validKondisi.includes(data.kondisi.trim())) {
    errors.kondisi = `Kondisi harus salah satu dari: ${validKondisi.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
