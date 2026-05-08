/**
 * 백엔드·프로필에서 role이 roleCode, role, roles[0] 객체 등 여러 형태로 올 수 있음.
 * AdminPage는 ADMIN / SUBADMIN 모두 허용(isAdminLike).
 */

export function getEffectiveRoleCode(user) {
  if (!user || typeof user !== 'object') return '';

  const firstRole = user.roles?.[0];
  const fromArray =
    typeof firstRole === 'object' && firstRole != null
      ? firstRole.role_code ?? firstRole.roleCode ?? firstRole.role ?? ''
      : firstRole ?? '';

  let raw =
    user.role_code ?? user.roleCode ?? user.role ?? user.userRole ?? fromArray ?? '';

  raw = String(raw).trim().toUpperCase();
  if (raw.startsWith('ROLE_')) {
    raw = raw.slice(5);
  }
  return raw;
}

/** 최고 관리자(ADMIN) · 중간 관리자(SUBADMIN) — 관리자 콘솔 진입 */
export function canAccessAdminPage(user) {
  const code = getEffectiveRoleCode(user);
  return code === 'ADMIN' || code === 'SUBADMIN' || code === 'SUPER_ADMIN';
}
