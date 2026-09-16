import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, updateRoom, deleteRoom, toggleRoomStatus } from '@/lib/school-inventory-service';
import { getSessionUserFromRequest } from '@/lib/auth-server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(req);
    const { id } = await params;
    const roomId = parseInt(id, 10);
    if (isNaN(roomId)) {
      return NextResponse.json({ success: false, message: 'ID ruangan tidak valid' }, { status: 400 });
    }

    const room = await getRoomById(roomId, user);
    if (!room) {
      return NextResponse.json({ success: false, message: 'Ruangan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: room });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat ruangan', error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Autentikasi diperlukan', error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    const roomId = parseInt(id, 10);
    if (isNaN(roomId)) {
      return NextResponse.json({ success: false, message: 'ID ruangan tidak valid' }, { status: 400 });
    }

    const body = await req.json();
    const result = await updateRoom(
      roomId,
      {
        name: body.name || body.nama_ruangan,
        kode_ruangan: body.kode_ruangan,
        jurusan_id: body.jurusan_id !== undefined ? (body.jurusan_id ? Number(body.jurusan_id) : null) : undefined,
        lokasi: body.lokasi,
        keterangan: body.keterangan,
        is_active: body.is_active,
      },
      user
    );

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: result.room, message: result.message });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memperbarui ruangan', error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Autentikasi diperlukan', error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    const roomId = parseInt(id, 10);
    if (isNaN(roomId)) {
      return NextResponse.json({ success: false, message: 'ID ruangan tidak valid' }, { status: 400 });
    }

    const result = await toggleRoomStatus(roomId, user);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 403 });
    }

    return NextResponse.json({ success: true, is_active: result.is_active, message: result.message });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengubah status ruangan', error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Autentikasi diperlukan', error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    const roomId = parseInt(id, 10);
    if (isNaN(roomId)) {
      return NextResponse.json({ success: false, message: 'ID ruangan tidak valid' }, { status: 400 });
    }

    const result = await deleteRoom(roomId, user);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menghapus ruangan', error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

