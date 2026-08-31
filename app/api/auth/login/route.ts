import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/school-inventory-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, username, email, password } = body;
    const userIdentifier = identifier || username || email;

    if (!userIdentifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username/Email dan Password wajib diisi.',
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const result = await authenticateUser(userIdentifier, password);
    if (!result.success || !result.user) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Kredensial tidak valid.',
          error: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      user: result.user,
    });

    // Set auth cookie
    response.cookies.set('app_session_user', JSON.stringify(result.user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Terjadi kesalahan pada server saat login.',
        error: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
