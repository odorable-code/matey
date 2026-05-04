/**
 * 커뮤니티 게시글 신규 작성은 운영자(ADMIN·SUBADMIN 등)만 허용.
 * 일반 회원은 기존 본인 글 수정·삭제 등은 별도 화면 로직으로 처리.
 */
export function canWriteCommunityPosts(user) {
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
