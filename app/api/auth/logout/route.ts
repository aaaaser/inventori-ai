import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil.',
  });

  response.cookies.delete('app_session_user');
  return response;
}
