import { NextRequest, NextResponse } from 'next/server';
import { getAllBarang, createBarang } from '@/lib/barang-service';
import { getSessionUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const kategori = searchParams.get('kategori') || '';
    const kondisi = searchParams.get('kondisi') || '';
    const sort = searchParams.get('sort') || 'terbaru';
    const jurusan = searchParams.get('jurusan') || '';

    const records = await getAllBarang(
      { search, kategori, kondisi, sort, jurusan },
      user || undefined
    );

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    console.error('API Error [GET /api/barang]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data barang' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(request);
    const body = await request.json();
    const result = await createBarang(body, user || undefined);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Gagal menambahkan barang',
          errors: result.errors,
        },
        { status: result.errors?.kode ? 409 : 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: result.data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API Error [POST /api/barang]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses data barang' },
      { status: 500 }
    );
  }
}
