/**

 * 스프링 권한·DB role_code가 섞여도 동일하게 비교합니다.

 */

function resolveRoleCode(user) {

  if (!user || typeof user !== 'object') return '';

  let r = user.roleCode ?? user.role ?? user.roles?.[0] ?? '';

  r = String(r).trim();

  if (!r) return '';

  r = r.toUpperCase();

  if (r.startsWith('ROLE_')) {

    r = r.slice(5);

  }

  return r;

}



/**

 * 공지(notification=0) 등 운영 전용 카테고리 글 작성·해당 카테고리로 수정 허용 역할.

 */

export function isCommunityStaffPublisher(user) {

  const r = resolveRoleCode(user);

  return r === 'ADMIN' || r === 'SUPER_ADMIN' || r === 'SUBADMIN';

}



/** ADMIN_NOTICE 등록 API와 동일: ADMIN·SUPER_ADMIN만 (SUBADMIN 제외) */

export function isAdminNoticePublisher(user) {

  const r = resolveRoleCode(user);

  return r === 'ADMIN' || r === 'SUPER_ADMIN';

}



/** 글쓰기 폼에서 카테고리 선택 가능 여부 (이벤트는 관리자만) */

export function canSelectCategoryForWriting(user, category) {

  const n = category?.notification;

  if (n !== 0 && n !== '0') {

    return true;

  }

  const name = String(category?.name || '').trim();

  if (name === '이벤트') {

    // 정책: SUBADMIN도 운영 글 작성 가능(권한 부여만 제외)
    return isCommunityStaffPublisher(user);

  }

  return isCommunityStaffPublisher(user);

}


