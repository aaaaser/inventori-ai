import { NextRequest, NextResponse } from 'next/server';
import { toggleUserStatus } from '@/lib/school-inventory-service';
import { getSessionUserFromRequest } from '@/lib/auth-server';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(_req);
    const { id } = await params;
    const numId = parseInt(id, 10);

    const result = await toggleUserStatus(numId, user || undefined);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, error: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Status user berhasil diperbarui.',
      data: { is_active: result.is_active },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
