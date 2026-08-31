import { NextResponse } from 'next/server';
import { getMasterJurusan } from '@/lib/school-inventory-service';

export async function GET() {
  try {
    const jurusan = await getMasterJurusan();
    return NextResponse.json({
      success: true,
      data: jurusan,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
