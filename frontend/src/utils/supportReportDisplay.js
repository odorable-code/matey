/**
 * 커뮤니티 신고 티켓(CommunityReportModal)에서 만든 SUPPORT.content / title 파싱.
 */

const LINE_POST_ID = /^__MATEY_POST_ID__=(\d+)\s*$/;
const LINE_COMMENT_ID = /^__MATEY_COMMENT_ID__=(\d+)\s*$/;

/**
 * DB에 들어간 자동 접두어([REPORT…], [댓글 신고], 게시글#n 등)를 제거한 뒤 사용자 제목만 남김.
 */
export function aggressiveStripTitle(raw) {
  let t = String(raw ?? '')
    .replace(/^\uFEFF/, '')
    .normalize('NFKC')
    .trim();

  for (let i = 0; i < 12; i++) {
    const before = t;
    const bracket = t.match(/^\[([^\]]+)\]\s*/);
    if (bracket && /신고|REPORT/i.test(bracket[1])) {
      t = t.slice(bracket[0].length).trim();
      continue;
    }
    t = t.replace(/^\[REPORT\s+(POST|COMMENT)\s+\d+\]\s*/i, '').trim();
    t = t
      .replace(/^게시글\s*#\s*\d+(\s+댓글\s*#\s*\d+)?\s*/i, '')
      .replace(/^게시글\s*#\s*\d+\s*/i, '')
      .replace(/^댓글\s*#\s*\d+\s*/i, '')
      .trim();
    t = t.replace(/^(게시글 신고:|댓글 신고:)\s*/i, '').trim();
    if (t === before) break;
  }
  return t;
}

function isOnlyAutoIdTail(s) {
  const x = String(s || '').trim();
  if (!x) return true;
  return /^(게시글\s*#\s*\d+)(\s+댓글\s*#\s*\d+)?$/i.test(x);
}

/** 신고 카드 제목: 자동 메타만 있으면 신고 본문 일부를 제목으로 사용 */
export function getReportCardTitle(row) {
  let t = aggressiveStripTitle(row?.title);
  if (!t || isOnlyAutoIdTail(t)) {
    const rawContent = String(row?.content || '');
    const body = extractUserReportBody(stripInternalMetaLines(rawContent));
    const one = body.replace(/\s+/g, ' ').trim();
    if (one) return one.length > 72 ? `${one.slice(0, 72)}…` : one;
  }
  return t || '제목 없음';
}

/** 일반 문의 등 제목 표시 */
export function displaySupportTicketTitle(rawTitle) {
  const t = aggressiveStripTitle(rawTitle);
  return t || '제목 없음';
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

/** 사용자가 신고 폼에 적은 내용만 (템플릿·미리보기 라인 제외) */
export function extractUserReportBody(strippedContent) {
  const c = String(strippedContent || '');
  const marker = '신고 내용:';
  const idx = c.indexOf(marker);
  if (idx === -1) {
    const stripped = c
      .split(/\r?\n/)
      .filter((line) => {
        const L = line.trimStart();
        if (L.startsWith('신고 대상')) return false;
        if (L.startsWith('작성자:')) return false;
        if (L.startsWith('대상 글:')) return false;
        return true;
      })
      .join('\n')
      .trim();
    return stripped;
  }
  return c.slice(idx + marker.length).trim();
}

const TITLE_META_EN = /^\[REPORT\s+(POST|COMMENT)\s+(\d+)\]\s*/i;

/**
 * @param {object} row — support list 항목
 */
export function parseSupportReportForDisplay(row) {
  const title = String(row?.title || '');
  const meta = title.match(TITLE_META_EN);
  const targetFromTitle = meta ? meta[1].toUpperCase() : '';
  const idFromTitle = meta ? Number(meta[2]) : null;

  let targetType = String(row?.targetType || targetFromTitle || '')
    .trim()
    .toUpperCase();
  if (!targetType && /^\[\s*댓글\s*신고\s*\]/i.test(title)) targetType = 'COMMENT';
  if (!targetType && /^\[\s*게시글\s*신고\s*\]/i.test(title)) targetType = 'POST';

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

  const postAuthor = lineValue(content, '작성자:');
  const commentAuthor = targetType === 'COMMENT' ? postAuthor : '';
  const reportBody = extractUserReportBody(content);

  const authorLabel = targetType === 'POST' ? '게시글 작성자' : '댓글 작성자';
  const authorName = targetType === 'POST' ? postAuthor : commentAuthor;

  const linkPostId = postId;
  const linkHash =
    targetType === 'COMMENT' && commentId != null
      ? `matey-comment-${commentId}`
      : '';

  return {
    targetType,
    reasonName: String(row?.reasonName || '').trim(),
    authorLabel,
    authorName: authorName || '',
    reportBody: reportBody || '',
    linkPostId,
    linkHash,
  };
}
