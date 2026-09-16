import { NextRequest, NextResponse } from 'next/server';
import {
  getAssetGroups,
  createAssetGroup,
  createUnitsForAssetGroup,
  generateNextAssetGroupCode,
} from '@/lib/school-inventory-service';
import { getSessionUserFromRequest, checkRoutePermission } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    const { searchParams } = new URL(req.url);

    const jurusanId = searchParams.get('jurusanId')
      ? parseInt(searchParams.get('jurusanId')!, 10)
      : undefined;
    const jurusanKode = searchParams.get('jurusanKode') || undefined;
    const search = searchParams.get('search') || undefined;
    const nextCodeFor = searchParams.get('nextCodeFor');

    if (nextCodeFor) {
      const nextCode = await generateNextAssetGroupCode(nextCodeFor);
      return NextResponse.json({ success: true, nextCode });
    }

    const groups = await getAssetGroups(
      { jurusanId, jurusanKode, search },
      user || undefined
    );

    return NextResponse.json({
      success: true,
      data: groups,
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

    // If request contains initial units creation or only group creation
    if (body.createUnitsOnly && body.asset_group_id) {
      const unitResult = await createUnitsForAssetGroup(body, user || undefined);
      if (!unitResult.success) {
        return NextResponse.json(
          { success: false, message: unitResult.message, error: 'BAD_REQUEST' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: unitResult.message,
        data: unitResult.assetsCreated,
      });
    }

    // Create new group
    const result = await createAssetGroup(body, user || undefined);
    if (!result.success || !result.group) {
      return NextResponse.json(
        { success: false, message: result.message, error: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // If units were also requested to be created immediately
    if (body.jumlah && Number(body.jumlah) > 0) {
      const unitResult = await createUnitsForAssetGroup(
        {
          asset_group_id: result.group.id,
          jumlah: Number(body.jumlah),
          kondisi: body.kondisi || 'BAIK',
          ruangan_id: body.ruangan_id,
          ruangan_nama: body.ruangan_nama,
          tahun_perolehan: body.tahun_perolehan,
          sumber_dana: body.sumber_dana,
          harga_perolehan: body.harga_perolehan,
          nomor_seri_prefix: body.nomor_seri_prefix,
          keterangan: body.keterangan,
        },
        user || undefined
      );

      return NextResponse.json({
        success: true,
        message: `Jenis barang ${result.group.kode_kelompok} dan ${body.jumlah} unit berhasil didaftarkan.`,
        data: {
          group: result.group,
          units: unitResult.assetsCreated,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: { group: result.group },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
