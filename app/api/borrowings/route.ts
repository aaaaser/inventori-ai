import { NextRequest, NextResponse } from 'next/server';
import {
  getAllBorrowings,
  createBorrowingRequest,
} from '@/lib/school-inventory-service';
import { getSessionUserFromRequest, checkRoutePermission } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    const { searchParams } = new URL(req.url);

    const jurusanKode = searchParams.get('jurusan') || undefined;
    const status = searchParams.get('status') || undefined;
    const userId = searchParams.get('user_id')
      ? parseInt(searchParams.get('user_id')!, 10)
      : undefined;

    const borrowings = await getAllBorrowings(
      {
        jurusanKode,
        status,
        userId,
      },
      user || undefined
    );

    return NextResponse.json({
      success: true,
      data: borrowings,
      total: borrowings.length,
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
    const auth = checkRoutePermission(user, 'borrowing.create');
    if (!auth.authorized || !user) {
      return NextResponse.json(
        { success: false, message: auth.message, error: 'FORBIDDEN' },
        { status: auth.status }
      );
    }

    const body = await req.json();
    const {
      jurusan_id,
      tanggal_peminjaman,
      tanggal_pengembalian_rencana,
      tujuan,
      keperluan,
      catatan,
      asset_ids,
    } = body;

    if (
      !jurusan_id ||
      !tanggal_peminjaman ||
      !tanggal_pengembalian_rencana ||
      !tujuan ||
      !keperluan ||
      !asset_ids ||
      !Array.isArray(asset_ids) ||
      asset_ids.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data pengajuan belum lengkap. Pastikan mengisi tanggal, tujuan, keperluan, dan memilih unit aset.',
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const result = await createBorrowingRequest(
      {
        jurusan_id: Number(jurusan_id),
        tanggal_peminjaman,
        tanggal_pengembalian_rencana,
        tujuan,
        keperluan,
        catatan,
        asset_ids: asset_ids.map((id: any) => Number(id)),
      },
      user
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
        data: result.borrowing,
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
