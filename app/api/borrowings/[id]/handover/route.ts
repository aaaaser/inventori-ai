import { NextRequest, NextResponse } from 'next/server';
import { handoverBorrowing } from '@/lib/school-inventory-service';
import { getSessionUserFromRequest } from '@/lib/auth-server';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(_req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Silakan login terlebih dahulu.', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const numId = parseInt(id, 10);

    const result = await handoverBorrowing(numId, user);
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
