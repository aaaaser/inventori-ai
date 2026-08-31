import { NextResponse } from 'next/server';
import { getMasterCategories } from '@/lib/school-inventory-service';

export async function GET() {
  try {
    const categories = await getMasterCategories();
    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
