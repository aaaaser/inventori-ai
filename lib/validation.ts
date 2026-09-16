export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateBarangInput(data: {
  kode?: any;
  nama?: any;
  kategori?: any;
  ruangan?: any;
  ruangan_id?: any;
  jumlah?: any;
  kondisi?: any;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate kode
  if (data.kode && typeof data.kode === 'string' && data.kode.trim() !== '') {
    if (data.kode.trim().length > 50) {
      errors.kode = 'Kode barang maksimal 50 karakter';
    }
  }

  // Validate nama
  if (!data.nama || typeof data.nama !== 'string' || data.nama.trim() === '') {
    errors.nama = 'Nama barang wajib diisi';
  } else if (data.nama.trim().length < 2) {
    errors.nama = 'Nama barang minimal 2 karakter';
  } else if (data.nama.trim().length > 200) {
    errors.nama = 'Nama barang maksimal 200 karakter';
  }

  // Validate ruangan
  if (!data.ruangan && !data.ruangan_id) {
    errors.ruangan = 'Ruangan / penempatan wajib dipilih';
  }

  // Validate jumlah
  if (data.jumlah === undefined || data.jumlah === null || data.jumlah === '') {
    errors.jumlah = 'Jumlah unit barang wajib diisi';
  } else {
    const num = Number(data.jumlah);
    if (isNaN(num)) {
      errors.jumlah = 'Jumlah harus berupa angka';
    } else if (!Number.isInteger(num)) {
      errors.jumlah = 'Jumlah harus bilangan bulat';
    } else if (num < 1) {
      errors.jumlah = 'Jumlah minimal 1 unit';
    }
  }

  // Validate kondisi
  const validKondisi = ['Baru', 'Baik', 'Rusak Ringan', 'Rusak Berat', 'BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'];
  if (!data.kondisi || typeof data.kondisi !== 'string' || data.kondisi.trim() === '') {
    errors.kondisi = 'Kondisi barang wajib dipilih';
  } else if (!validKondisi.includes(data.kondisi.trim())) {
    errors.kondisi = `Kondisi tidak valid`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRuanganInput(data: {
  name?: any;
  nama_ruangan?: any;
  kode_ruangan?: any;
  jurusan_id?: any;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const nameVal = data.name || data.nama_ruangan;
  if (!nameVal || typeof nameVal !== 'string' || nameVal.trim() === '') {
    errors.name = 'Nama ruangan wajib diisi';
  } else if (nameVal.trim().length < 2) {
    errors.name = 'Nama ruangan minimal 2 karakter';
  } else if (nameVal.trim().length > 100) {
    errors.name = 'Nama ruangan maksimal 100 karakter';
  }

  if (data.kode_ruangan && typeof data.kode_ruangan === 'string') {
    if (data.kode_ruangan.trim().length > 50) {
      errors.kode_ruangan = 'Kode ruangan maksimal 50 karakter';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
