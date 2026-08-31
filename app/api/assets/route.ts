import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAssets,
  createAssetWithUnits,
} from '@/lib/school-inventory-service';
import { getSessionUserFromRequest, checkRoutePermission } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    const { searchParams } = new URL(req.url);

    const jurusanKode = searchParams.get('jurusan') || undefined;
    const kategori = searchParams.get('kategori') || undefined;
    const kondisi = searchParams.get('kondisi') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const ruanganId = searchParams.get('ruangan_id')
      ? parseInt(searchParams.get('ruangan_id')!, 10)
      : undefined;

    const assets = await getAllAssets({
      jurusanKode,
      kategoriName: kategori,
      kondisi,
      status,
      search,
      ruanganId,
    });

    return NextResponse.json({
      success: true,
      data: assets,
      total: assets.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    const auth = checkRoutePermission(user, 'asset.create');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message, error: 'FORBIDDEN' },
        { status: auth.status }
      );
    }

    const body = await req.json();
    const {
      nama_barang,
      jurusan_id,
      kategori_id,
      kategori_name,
      ruangan_id,
      ruangan_name,
      merk,
      tipe,
      jumlah,
      kondisi,
      tahun_perolehan,
      sumber_dana,
      harga_perolehan,
      nomor_seri_prefix,
      keterangan,
    } = body;

    if (!nama_barang || !jurusan_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nama barang dan Jurusan wajib diisi.',
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const result = await createAssetWithUnits(
      {
        nama_barang,
        jurusan_id: Number(jurusan_id),
        kategori_id: kategori_id ? Number(kategori_id) : undefined,
        kategori_name,
        ruangan_id: ruangan_id ? Number(ruangan_id) : undefined,
        ruangan_name,
        merk,
        tipe,
        jumlah: jumlah ? Number(jumlah) : 1,
        kondisi: kondisi || 'BAIK',
        tahun_perolehan: tahun_perolehan ? Number(tahun_perolehan) : undefined,
        sumber_dana,
        harga_perolehan: harga_perolehan ? Number(harga_perolehan) : undefined,
        nomor_seri_prefix,
        keterangan,
      },
      user || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, error: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: {
          group: result.group,
          assets: result.assetsCreated,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
