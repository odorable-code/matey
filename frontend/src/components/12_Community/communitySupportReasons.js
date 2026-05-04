/** SUPPORT_REASON.target_type 기준으로 문의용 / 신고용 분류 */

function normTargetType(r) {
  return String(r?.targetType || '')
    .trim()
    .toUpperCase();
}

export function isPostOrCommentReason(r) {
  const tt = normTargetType(r);
  return tt === 'POST' || tt === 'COMMENT';
}

/** FAQ 아래 일반 문의: 게시글/댓글 전용 신고 사유는 제외 */
export function filterInquiryReasons(reasons) {
  return (reasons || []).filter((r) => r.isActive !== false && !isPostOrCommentReason(r));
}

/**
 * 게시글·댓글 신고: target_type이 일치하는 사유만.
 * DB에 전용 행이 없으면 일반 문의 사유로 폴백(접수는 가능하도록).
 */
export function filterReportReasons(reasons, target) {
  const want = String(target || '').toUpperCase();
  const list = reasons || [];
  const matched = list.filter(
    (r) => r.isActive !== false && normTargetType(r) === want
  );
  if (matched.length > 0) {
    return matched;
  }
  return filterInquiryReasons(list);
}
