import { NextResponse } from 'next/server';
import { getDbStatus } from '@/lib/barang-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getDbStatus();
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('API Error [GET /api/db-status]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memeriksa status database' },
      { status: 500 }
    );
  }
}
