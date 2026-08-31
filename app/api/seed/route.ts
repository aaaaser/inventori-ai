import { NextResponse } from 'next/server';
import { seedSampleData } from '@/lib/barang-service';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await seedSampleData();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error [POST /api/seed]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal melakukan seed data' },
      { status: 500 }
    );
  }
}
