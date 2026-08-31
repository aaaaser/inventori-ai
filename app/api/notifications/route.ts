import { NextRequest, NextResponse } from 'next/server';
import {
  getAllNotifications,
  getUnreadNotificationCount,
  addNotification,
  markAllNotificationsAsRead,
} from '@/lib/notification-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id') || 'usr-1';

    const [notifications, unreadCount] = await Promise.all([
      getAllNotifications(userId),
      getUnreadNotificationCount(userId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    console.error('API Error [GET /api/notifications]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat notifikasi' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, title, message, user_id } = body;

    if (action === 'mark-all-read') {
      await markAllNotificationsAsRead(user_id || 'usr-1');
      return NextResponse.json({
        success: true,
        message: 'Semua notifikasi ditandai telah dibaca',
      });
    }

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'Title dan message wajib diisi' },
        { status: 400 }
      );
    }

    const created = await addNotification(title, message, user_id || 'usr-1');
    return NextResponse.json(
      {
        success: true,
        data: created,
        message: 'Notifikasi berhasil dibuat',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API Error [POST /api/notifications]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses notifikasi' },
      { status: 500 }
    );
  }
}
