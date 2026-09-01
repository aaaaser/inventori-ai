import {
  getAllAssets,
  getAssetById as getSchoolAssetById,
  createAssetWithUnits,
  updateAsset,
  deleteAsset,
  getInventoryStats,
  mapAssetToLegacyBarang,
} from './school-inventory-service';
import { Barang, BarangFormData, StatsData, UserSession } from './types';
import { getDataScope } from './data-scope';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

export async function getAllBarang(
  filters?: {
    kategori?: string;
    kondisi?: string;
    search?: string;
    sort?: string;
    jurusan?: string;
  },
  actor?: UserSession | null
): Promise<Barang[]> {
  const assets = await getAllAssets(
    {
      kategoriName: filters?.kategori,
      kondisi: filters?.kondisi,
      search: filters?.search,
      jurusanKode: filters?.jurusan,
    },
    actor
  );

  let result = assets.map(mapAssetToLegacyBarang);

  if (filters?.sort) {
    switch (filters.sort) {
      case 'nama_asc':
        result.sort((a, b) => a.nama.localeCompare(b.nama));
        break;
      case 'nama_desc':
        result.sort((a, b) => b.nama.localeCompare(a.nama));
        break;
      case 'jumlah_asc':
        result.sort((a, b) => a.jumlah - b.jumlah);
        break;
      case 'jumlah_desc':
        result.sort((a, b) => b.jumlah - a.jumlah);
        break;
      case 'terbaru':
      case 'created_desc':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'terlama':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      default:
        result.sort((a, b) => b.id - a.id);
    }
  }

  return result;
}

export async function getBarangList(
  filters?: {
    kategori?: string;
    kondisi?: string;
    search?: string;
    sortBy?: string;
  },
  actor?: UserSession | null
): Promise<Barang[]> {
  return getAllBarang(
    {
      kategori: filters?.kategori,
      kondisi: filters?.kondisi,
      search: filters?.search,
      sort: filters?.sortBy,
    },
    actor
  );
}

export async function getBarangById(id: number, actor?: UserSession | null): Promise<Barang | null> {
  const asset = await getSchoolAssetById(id, actor);
  return asset ? mapAssetToLegacyBarang(asset) : null;
}

export async function createBarang(data: BarangFormData, actor?: UserSession | null): Promise<ServiceResult<Barang>> {
  try {
    let jurId = 1;
    if (data.jurusan === 'ATPH') jurId = 2;
    if (data.jurusan === 'TBSM') jurId = 3;

    // Scope check: if actor is scoped, force their department
    const scope = getDataScope(actor);
    if (scope.isScoped && scope.jurusanId) {
      jurId = scope.jurusanId;
    }

    let kondisiNorm: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' = 'BAIK';
    if (data.kondisi === 'Rusak Ringan' || data.kondisi === 'RUSAK_RINGAN') kondisiNorm = 'RUSAK_RINGAN';
    if (data.kondisi === 'Rusak Berat' || data.kondisi === 'RUSAK_BERAT') kondisiNorm = 'RUSAK_BERAT';

    const res = await createAssetWithUnits(
      {
        nama_barang: data.nama,
        jurusan_id: jurId,
        kategori_name: data.kategori,
        ruangan_name: data.ruangan,
        merk: data.merk,
        tipe: data.tipe,
        jumlah: data.jumlah || 1,
        kondisi: kondisiNorm,
        tahun_perolehan: data.tahun_perolehan,
        sumber_dana: data.sumber_dana,
        harga_perolehan: data.harga_perolehan,
        keterangan: data.keterangan,
      },
      actor || undefined
    );

    if (res.assetsCreated && res.assetsCreated.length > 0) {
      const legacyBarang = mapAssetToLegacyBarang(res.assetsCreated[0]);
      return {
        success: true,
        data: legacyBarang,
        message: res.message || 'Barang berhasil ditambahkan',
      };
    }

    return {
      success: false,
      message: res.message || 'Gagal menambahkan barang',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan sistem saat menambah barang',
    };
  }
}

export async function updateBarang(
  id: number,
  data: Partial<BarangFormData>,
  actor?: UserSession | null
): Promise<ServiceResult<Barang>> {
  try {
    let kondisiNorm: 'BAIK' | 'RUSAK_RINGAN' | 'RUSAK_BERAT' | undefined = undefined;
    if (data.kondisi) {
      if (data.kondisi === 'Rusak Ringan' || data.kondisi === 'RUSAK_RINGAN') kondisiNorm = 'RUSAK_RINGAN';
      else if (data.kondisi === 'Rusak Berat' || data.kondisi === 'RUSAK_BERAT') kondisiNorm = 'RUSAK_BERAT';
      else kondisiNorm = 'BAIK';
    }

    const res = await updateAsset(
      id,
      {
        nama_barang: data.nama,
        merk: data.merk,
        tipe: data.tipe,
        nomor_seri: data.nomor_seri,
        kondisi: kondisiNorm,
        tahun_perolehan: data.tahun_perolehan,
        sumber_dana: data.sumber_dana,
        harga_perolehan: data.harga_perolehan,
        keterangan: data.keterangan,
      },
      actor || undefined
    );

    if (!res.success || !res.asset) {
      return {
        success: false,
        message: res.message || 'Data tidak ditemukan',
      };
    }

    return {
      success: true,
      data: mapAssetToLegacyBarang(res.asset),
      message: res.message || 'Barang berhasil diperbarui',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan sistem',
    };
  }
}

export async function deleteBarang(id: number, actor?: UserSession | null): Promise<ServiceResult<boolean>> {
  try {
    const res = await deleteAsset(id, actor || undefined);
    return {
      success: res.success,
      message: res.message,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Gagal menghapus data',
    };
  }
}

export async function getStats(actor?: UserSession | null): Promise<StatsData> {
  return await getInventoryStats(actor);
}

export async function seedDummyData(): Promise<number> {
  const assets = await getAllAssets();
  return assets.length;
}

export async function seedSampleData(): Promise<{ success: boolean; count: number; message: string }> {
  const assets = await getAllAssets();
  return {
    success: true,
    count: assets.length,
    message: `Database berhasil disinkronkan (${assets.length} aset siap pakai).`,
  };
}

export async function getDbStatus(): Promise<{
  connected: boolean;
  mode: string;
  totalRecords: number;
}> {
  const assets = await getAllAssets();
  return {
    connected: false,
    mode: 'In-Memory Development Store (Multi-Role RBAC Active)',
    totalRecords: assets.length,
  };
}

