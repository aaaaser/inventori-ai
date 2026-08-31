import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/school-inventory-service';
import { UserSession } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('app_session_user')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'Belum login.', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const parsed: UserSession = JSON.parse(sessionCookie);
    const user = await getUserById(parsed.id);

    if (!user || !user.is_active) {
      return NextResponse.json(
        { success: false, message: 'Sesi tidak valid atau pengguna nonaktif.', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}
