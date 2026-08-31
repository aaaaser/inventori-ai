import { NextResponse } from 'next/server';
import { getStats } from '@/lib/barang-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getStats();
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
