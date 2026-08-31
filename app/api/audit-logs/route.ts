import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/school-inventory-service';
import { getSessionUserFromRequest, checkRoutePermission } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    const auth = checkRoutePermission(user, 'audit.view');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message, error: 'FORBIDDEN' },
        { status: auth.status }
      );
    }

    const logs = await getAuditLogs();
    return NextResponse.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
