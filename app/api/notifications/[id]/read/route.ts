import { NextRequest, NextResponse } from 'next/server';
import { markNotificationAsRead } from '@/lib/notification-service';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notifId = parseInt(id, 10);

    if (isNaN(notifId)) {
      return NextResponse.json(
        { success: false, message: 'ID notifikasi tidak valid' },
        { status: 400 }
      );
    }

    const ok = await markNotificationAsRead(notifId);
    return NextResponse.json({
      success: ok,
      message: ok ? 'Notifikasi ditandai dibaca' : 'Notifikasi tidak ditemukan',
    });
  } catch (error: any) {
    console.error('API Error [POST /api/notifications/[id]/read]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui status notifikasi' },
      { status: 500 }
    );
  }
}
