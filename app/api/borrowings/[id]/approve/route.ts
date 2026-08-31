import { NextRequest, NextResponse } from 'next/server';
import { approveBorrowing } from '@/lib/school-inventory-service';
import { getSessionUserFromRequest } from '@/lib/auth-server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Silakan login terlebih dahulu.', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const numId = parseInt(id, 10);
    const body = await req.json().catch(() => ({}));
    const catatan = body.catatan || '';

    const result = await approveBorrowing(numId, catatan, user);
    if (!result.success) {
      const isForbidden =
        result.message?.includes('kewenangan') ||
        result.message?.includes('tidak memiliki') ||
        result.message?.includes('jurusannya sendiri');

      return NextResponse.json(
        {
          success: false,
          message: result.message,
          error: isForbidden ? 'FORBIDDEN' : 'BAD_REQUEST',
        },
        { status: isForbidden ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.borrowing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
