import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/lib/school-inventory-service';
import { getSessionUserFromRequest, checkRoutePermission } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    const auth = checkRoutePermission(user, 'user.view');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message, error: 'FORBIDDEN' },
        { status: auth.status }
      );
    }

    const users = await getAllUsers();
    return NextResponse.json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    const auth = checkRoutePermission(user, 'user.create');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message, error: 'FORBIDDEN' },
        { status: auth.status }
      );
    }

    const body = await req.json();
    const { name, username, email, password, role, jurusan_id } = body;

    if (!name || !username || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nama, Username, Email, Password, dan Role wajib diisi.',
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const result = await createUser(
      {
        name,
        username,
        email,
        passwordPlain: password,
        role,
        jurusan_id: jurusan_id ? Number(jurusan_id) : undefined,
      },
      user || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, error: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Pengguna baru berhasil ditambahkan.',
        data: result.user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
