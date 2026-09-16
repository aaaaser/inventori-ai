import { NextRequest, NextResponse } from 'next/server';
import {
  getAssetMaintenances,
  createAssetMaintenance,
} from '@/lib/school-inventory-service';
import { getSessionUserFromRequest, checkRoutePermission } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    const { searchParams } = new URL(req.url);

    const assetId = searchParams.get('assetId')
      ? parseInt(searchParams.get('assetId')!, 10)
      : undefined;
    const jurusanKode = searchParams.get('jurusanKode') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const list = await getAssetMaintenances(
      { assetId, jurusanKode, status, search },
      user || undefined
    );

    return NextResponse.json({
      success: true,
      data: list,
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
    const auth = checkRoutePermission(user, 'asset.update');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message, error: 'FORBIDDEN' },
        { status: auth.status }
      );
    }

    const body = await req.json();

    if (!body.asset_id || !body.jenis_perawatan || !body.pelaksana) {
      return NextResponse.json(
        { success: false, message: 'Data perawatan tidak lengkap (Aset, Jenis Perawatan, dan Pelaksana wajib diisi).', error: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const result = await createAssetMaintenance(body, user || undefined);
    if (!result.success || !result.maintenance) {
      return NextResponse.json(
        { success: false, message: result.message, error: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.maintenance,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
