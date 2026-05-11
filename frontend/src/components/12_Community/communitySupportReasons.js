/** SUPPORT_REASON.target_type 기준으로 문의용 / 신고용 분류 */

/** GET /support/reasons 응답 형태가 바뀌어도 배열만 뽑아 씀 */
export function normalizeReasonsPayload(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.reasons)) return res.reasons;
  if (Array.isArray(res?.data?.reasons)) return res.data.reasons;
  return [];
}

/** Jackson 이 boolean 을 active 로 내보내는 경우 대비 */
function reasonActive(r) {
  if (r == null) return false;
  if (r.isActive === false || r.active === false) return false;
  return true;
}

function normTargetType(r) {
  return String(r?.targetType || r?.target_type || '')
    .trim()
    .toUpperCase();
}

export function isPostOrCommentReason(r) {
  const tt = normTargetType(r);
  return tt === 'POST' || tt === 'COMMENT';
}

/** FAQ 아래 일반 문의: 게시글/댓글 전용 신고 사유는 제외 */
export function filterInquiryReasons(reasons) {
  return (reasons || []).filter((r) => reasonActive(r) && !isPostOrCommentReason(r));
}

/**
 * 게시글·댓글 신고: target_type이 일치하는 사유만.
 * DB에 전용 행이 없으면 일반 문의 사유로 폴백(접수는 가능하도록).
 */
export function filterReportReasons(reasons, target) {
  const want = String(target || '').toUpperCase();
  const list = reasons || [];
  const matched = list.filter(
    (r) => reasonActive(r) && normTargetType(r) === want
  );
  if (matched.length > 0) {
    return matched;
  }
  return filterInquiryReasons(list);
}
