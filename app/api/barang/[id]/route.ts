import { NextRequest, NextResponse } from 'next/server';
import { getBarangById, updateBarang, deleteBarang } from '@/lib/barang-service';
import { getSessionUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(request);
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID barang tidak valid' },
        { status: 400 }
      );
    }

    const item = await getBarangById(id, user || undefined);
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error('API Error [GET /api/barang/:id]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil detail barang' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(request);
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID barang tidak valid' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = await updateBarang(id, body, user || undefined);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Gagal memperbarui barang',
          errors: result.errors,
        },
        { status: result.errors?.kode ? 409 : result.message === 'Data tidak ditemukan' ? 404 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error('API Error [PUT /api/barang/:id]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui data barang' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(request);
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID barang tidak valid' },
        { status: 400 }
      );
    }

    const result = await deleteBarang(id, user || undefined);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Barang berhasil dihapus',
      data: { id },
    });
  } catch (error: any) {
    console.error('API Error [DELETE /api/barang/:id]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus data barang' },
      { status: 500 }
    );
  }
}
