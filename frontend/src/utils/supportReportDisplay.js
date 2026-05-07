/**
 * 커뮤니티 신고 티켓(CommunityReportModal)에서 만든 SUPPORT.content / title 파싱.
 * 구버전 티켓(메타 없음)은 일부 필드가 비거나 링크가 제한될 수 있음.
 */

const TITLE_META = /^\[REPORT\s+(POST|COMMENT)\s+(\d+)\]\s*/i;
const LINE_POST_ID = /^__MATEY_POST_ID__=(\d+)\s*$/;
const LINE_COMMENT_ID = /^__MATEY_COMMENT_ID__=(\d+)\s*$/;

export function stripReportMetaFromTitle(rawTitle) {
  return String(rawTitle || '').replace(TITLE_META, '').trim();
}

/** 목록·상세 카드에 쓰는 사용자 작성 제목 */
export function displaySupportTicketTitle(rawTitle) {
  const t = stripReportMetaFromTitle(String(rawTitle || ''));
  const cleaned = t.replace(/^(게시글 신고:|댓글 신고:)\s*/i, '').trim();
  return cleaned || '제목 없음';
}

function stripInternalMetaLines(rawContent) {
  const lines = String(rawContent || '').split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (LINE_POST_ID.test(line) || LINE_COMMENT_ID.test(line)) {
      i += 1;
      continue;
    }
    out.push(line);
    i += 1;
  }
  return out.join('\n');
}

function lineValue(text, prefix) {
  const lines = String(text || '').split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith(prefix)) return line.slice(prefix.length).trim();
  }
  return '';
}

function extractUserReportBody(strippedContent) {
  const c = String(strippedContent || '');
  const marker = '신고 내용:';
  const idx = c.indexOf(marker);
  if (idx === -1) return c.trim();
  return c.slice(idx + marker.length).trim();
}

/**
 * @param {object} row — support list 항목 (title, content, targetType, …)
 */
export function parseSupportReportForDisplay(row) {
  const title = String(row?.title || '');
  const meta = title.match(TITLE_META);
  const targetFromTitle = meta ? meta[1].toUpperCase() : '';
  const idFromTitle = meta ? Number(meta[2]) : null;

  const targetType = String(row?.targetType || targetFromTitle || '')
    .trim()
    .toUpperCase();

  let postId = null;
  let commentId = null;
  if (targetType === 'POST' && idFromTitle != null && !Number.isNaN(idFromTitle)) {
    postId = idFromTitle;
  }
  if (targetType === 'COMMENT' && idFromTitle != null && !Number.isNaN(idFromTitle)) {
    commentId = idFromTitle;
  }

  const rawContent = String(row?.content || '');
  const lines = rawContent.split(/\r?\n/);
  for (const line of lines) {
    const pm = line.match(LINE_POST_ID);
    if (pm) postId = Number(pm[1]);
    const cm = line.match(LINE_COMMENT_ID);
    if (cm) commentId = Number(cm[1]);
  }

  const content = stripInternalMetaLines(rawContent);

  const postTitle = lineValue(content, '신고 대상 글:');
  const postAuthor = lineValue(content, '작성자:');
  const commentAuthor =
    targetType === 'COMMENT' ? lineValue(content, '작성자:') : '';
  const reportBody = extractUserReportBody(content);

  const linkPostId = postId;
  const linkHash =
    targetType === 'COMMENT' && commentId != null
      ? `matey-comment-${commentId}`
      : '';

  return {
    userTitle: displaySupportTicketTitle(title),
    targetType,
    reasonName: String(row?.reasonName || '').trim(),
    postTitle: postTitle || '',
    postAuthor: postAuthor || '',
    commentAuthor: commentAuthor || '',
    reportBody: reportBody || '',
    linkPostId,
    linkHash,
  };
}
