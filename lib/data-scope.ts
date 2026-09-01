import { UserSession } from './types';
import { UserRole, JurusanKode } from './rbac';

export type ScopeType = 'ALL' | 'JURUSAN';

export interface DataScope {
  type: ScopeType;
  isScoped: boolean;
  role: UserRole;
  jurusanId?: number | null;
  jurusanKode?: JurusanKode | string | null;
  canAccessAllDepartments: boolean;
}

/**
 * Returns the data access scope for a given authenticated user.
 * 
 * Rules:
 * - SUPER_ADMIN    -> Scope: ALL (All departments: RPL, ATPH, TBSM)
 * - OPERATOR       -> Scope: ALL (All departments)
 * - KEPALA_SEKOLAH -> Scope: ALL (All departments)
 * - WAKA_SARPRAS   -> Scope: ALL (All departments)
 * - KAKOM          -> Scope: JURUSAN (Restricted to authenticated user's department)
 * - LABORAN        -> Scope: JURUSAN (Restricted to authenticated user's department)
 */
export function getDataScope(user: UserSession | null | undefined): DataScope {
  if (!user) {
    return {
      type: 'ALL',
      isScoped: false,
      role: 'SUPER_ADMIN',
      canAccessAllDepartments: true,
    };
  }

  // KAKOM & LABORAN are strictly department-scoped
  if (user.role === 'KAKOM' || user.role === 'LABORAN') {
    let jId = user.jurusan_id;
    let jKode = user.jurusan_kode;

    if (!jKode && jId) {
      if (jId === 1) jKode = 'RPL';
      else if (jId === 2) jKode = 'ATPH';
      else if (jId === 3) jKode = 'TBSM';
    }

    if (!jId && jKode) {
      if (jKode === 'RPL') jId = 1;
      else if (jKode === 'ATPH') jId = 2;
      else if (jKode === 'TBSM') jId = 3;
    }

    return {
      type: 'JURUSAN',
      isScoped: true,
      role: user.role,
      jurusanId: jId,
      jurusanKode: jKode,
      canAccessAllDepartments: false,
    };
  }

  // School-wide roles (SUPER_ADMIN, OPERATOR, KEPALA_SEKOLAH, WAKA_SARPRAS)
  return {
    type: 'ALL',
    isScoped: false,
    role: user.role,
    jurusanId: null,
    jurusanKode: null,
    canAccessAllDepartments: true,
  };
}

/**
 * Validates whether a user is allowed to access data from a target department.
 */
export function canAccessJurusan(
  user: UserSession | null | undefined,
  targetJurusanKode?: string | null,
  targetJurusanId?: number | null
): boolean {
  if (!user) return true;
  const scope = getDataScope(user);
  if (scope.canAccessAllDepartments) return true;

  if (targetJurusanKode && scope.jurusanKode) {
    return targetJurusanKode.toUpperCase() === String(scope.jurusanKode).toUpperCase();
  }

  if (targetJurusanId && scope.jurusanId) {
    return Number(targetJurusanId) === Number(scope.jurusanId);
  }

  return true;
}

/**
 * Returns effective department code filter based on user scope.
 * If user is department-scoped, forces the user's department code.
 * If user has full access, honors the requested filter.
 */
export function getEffectiveJurusanFilter(
  user: UserSession | null | undefined,
  requestedJurusan?: string | null
): string | undefined {
  const scope = getDataScope(user);
  if (scope.isScoped && scope.jurusanKode) {
    return String(scope.jurusanKode);
  }
  return requestedJurusan || undefined;
}
