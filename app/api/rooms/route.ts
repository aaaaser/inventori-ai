import { NextRequest, NextResponse } from 'next/server';
import { getMasterRooms } from '@/lib/school-inventory-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jurusanId = searchParams.get('jurusan_id')
      ? parseInt(searchParams.get('jurusan_id')!, 10)
      : undefined;

    const rooms = await getMasterRooms(jurusanId);
    return NextResponse.json({
      success: true,
      data: rooms,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
