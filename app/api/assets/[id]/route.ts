import { NextRequest, NextResponse } from 'next/server';
import {
  getAssetById,
  updateAsset,
  deleteAsset,
  getAssetHistories,
} from '@/lib/school-inventory-service';
import { getSessionUserFromRequest, checkRoutePermission } from '@/lib/auth-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json(
        { success: false, message: 'ID aset tidak valid.', error: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const asset = await getAssetById(numId);
    if (!asset) {
      return NextResponse.json(
        { success: false, message: 'Aset tidak ditemukan.', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const histories = await getAssetHistories(numId);

    return NextResponse.json({
      success: true,
      data: {
        ...asset,
        histories,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(req);
    const auth = checkRoutePermission(user, 'asset.update');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message, error: 'FORBIDDEN' },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const numId = parseInt(id, 10);
    const body = await req.json();

    const result = await updateAsset(numId, body, user || undefined);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, error: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.asset,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(req);
    const auth = checkRoutePermission(user, 'asset.delete');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message, error: 'FORBIDDEN' },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const numId = parseInt(id, 10);

    const result = await deleteAsset(numId, user || undefined);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, error: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
