import { NextRequest } from 'next/server';
import { UserSession } from './types';
import { getUserById } from './school-inventory-service';
import { Permission, hasPermission } from './rbac';

export async function getSessionUserFromRequest(req: NextRequest): Promise<UserSession | null> {
  const cookie = req.cookies.get('app_session_user')?.value;
  if (!cookie) return null;

  try {
    const parsed = JSON.parse(cookie);
    if (!parsed?.id) return null;
    const user = await getUserById(parsed.id);
    if (!user || !user.is_active) return null;
    return user;
  } catch {
    return null;
  }
}

export function checkRoutePermission(
  user: UserSession | null,
  permission: Permission
): { authorized: boolean; status: number; message: string } {
  if (!user) {
    return { authorized: false, status: 401, message: 'Silakan login terlebih dahulu.' };
  }
  if (!user.is_active) {
    return { authorized: false, status: 403, message: 'Akun Anda dinonaktifkan.' };
  }
  if (!hasPermission(user.role, permission)) {
    return {
      authorized: false,
      status: 403,
      message: `Akses ditolak: Role ${user.role} tidak memiliki izin '${permission}'.`,
    };
  }
  return { authorized: true, status: 200, message: 'Authorized' };
}
