import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/lib/barang-service';
import { getSessionUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(request);
    const stats = await getStats(user || undefined);
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('API Error [GET /api/stats]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat statistik' },
      { status: 500 }
    );
  }
}
