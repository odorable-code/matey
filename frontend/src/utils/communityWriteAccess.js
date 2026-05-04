/**
 * 공지(notification=0) 등 운영 전용 카테고리 글 작성·해당 카테고리로 수정 허용 역할.
 */
export function isCommunityStaffPublisher(user) {
  const r = String(user?.role || user?.roleCode || user?.roles?.[0] || '').trim().toUpperCase();
  return (
    r === 'ADMIN' ||
    r === 'ROLE_ADMIN' ||
    r === 'SUBADMIN' ||
    r === 'ROLE_SUBADMIN' ||
    r === 'SUPER_ADMIN' ||
    r === 'ROLE_SUPER_ADMIN'
  );
}

