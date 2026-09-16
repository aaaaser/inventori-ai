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
    const status = searchParams.get('status') || '';
    const sort = searchParams.get('sort') || 'terbaru';
    const sort_by = searchParams.get('sort_by') || '';
    const sort_dir = searchParams.get('sort_dir') || 'asc';
    const jurusan = searchParams.get('jurusan') || '';
    const ruanganIdParam = searchParams.get('ruangan_id');
    const ruangan_id = ruanganIdParam ? parseInt(ruanganIdParam, 10) : undefined;
    const pageParam = searchParams.get('page');
    const perPageParam = searchParams.get('per_page') || searchParams.get('limit');

    const records = await getAllBarang(
      {
        search,
        kategori,
        kondisi,
        status,
        sort,
        sort_by,
        sort_dir,
        jurusan,
        ruangan_id,
      },
      user || undefined
    );

    const total = records.length;

    // Optional server-side slice if page and per_page are provided
    if (pageParam && perPageParam) {
      const page = Math.max(1, parseInt(pageParam, 10) || 1);
      const perPage = Math.max(1, parseInt(perPageParam, 10) || 10);
      const start = (page - 1) * perPage;
      const paginatedData = records.slice(start, start + perPage);

      return NextResponse.json({
        success: true,
        data: paginatedData,
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
      });
    }

    return NextResponse.json({
      success: true,
      data: records,
      total,
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
