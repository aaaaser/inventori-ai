import { NextRequest, NextResponse } from 'next/server';
import { getBorrowingById } from '@/lib/school-inventory-service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json(
        { success: false, message: 'ID pengajuan tidak valid.', error: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const borrowing = await getBorrowingById(numId);
    if (!borrowing) {
      return NextResponse.json(
        { success: false, message: 'Data pengajuan peminjaman tidak ditemukan.', error: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: borrowing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
