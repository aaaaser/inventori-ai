import { NextRequest, NextResponse } from 'next/server';
import { getMasterRooms, createRoom } from '@/lib/school-inventory-service';
import { getSessionUserFromRequest } from '@/lib/auth-server';
import { validateRuanganInput } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const jurusanId = searchParams.get('jurusan_id')
      ? parseInt(searchParams.get('jurusan_id')!, 10)
      : undefined;
    const activeOnly = searchParams.get('active_only') === 'true';

    const rooms = await getMasterRooms(jurusanId, user, activeOnly);
    return NextResponse.json({
      success: true,
      data: rooms,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat data ruangan', error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = validateRuanganInput(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validasi data ruangan gagal', errors: validation.errors },
        { status: 400 }
      );
    }

    const result = await createRoom(
      {
        name: body.name || body.nama_ruangan,
        kode_ruangan: body.kode_ruangan,
        jurusan_id: body.jurusan_id ? Number(body.jurusan_id) : null,
        lokasi: body.lokasi,
        keterangan: body.keterangan,
      },
      user
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.room, message: result.message },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal membuat ruangan', error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}


