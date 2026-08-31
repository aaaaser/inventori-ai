import { NextRequest, NextResponse } from 'next/server';
import { resetUserPassword } from '@/lib/school-inventory-service';
import { getSessionUserFromRequest } from '@/lib/auth-server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(req);
    const { id } = await params;
    const numId = parseInt(id, 10);
    const body = await req.json().catch(() => ({}));
    const newPassword = body.newPassword || body.password;

    if (!newPassword) {
      return NextResponse.json(
        { success: false, message: 'Password baru wajib diisi.', error: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const result = await resetUserPassword(numId, newPassword, user || undefined);
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
