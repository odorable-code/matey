/**
 * 정적 에셋 경로(모션·배경 등) — 상대경로를 브라우저 기준으로 통일.
 * CRA 하위 경로 배포 시 PUBLIC_URL 접두를 붙입니다.
 */
export function normalizeMotionAssetUrl(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (s.startsWith('data:')) return s;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const path = s.startsWith('/') ? s : `/${s}`;
  const pub =
    typeof process !== 'undefined' && process.env && process.env.PUBLIC_URL
      ? String(process.env.PUBLIC_URL).replace(/\/$/, '')
      : '';
  return pub ? `${pub}${path}` : path;
}

/** MyPage 대시보드 무대: 이 친밀 단계까지만 모션 PNG 순환·상호작용에 사용 (예: 진저 L3+ 제외) */
export const DASHBOARD_MOTION_MAX_UNLOCK_INTIMACY_LEVEL = 2;

export function motionUnlockIntimacyLevel(m) {
  const raw = m?.unlockIntimacyLevel ?? m?.unlock_intimacy_level;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0) return n;
  return 0;
}

function motionTagTrim(m) {
  return String(m?.tag ?? '').trim();
}

/** 잠금 제외 + 해금 요구 친밀 단계가 대시보드 상한 이하인 행만 */
export function filterMotionsForDashboardStage(motions) {
  if (!Array.isArray(motions)) return [];
  return motions.filter((m) => {
    if (!m || motionTagTrim(m) === '잠금') return false;
    return motionUnlockIntimacyLevel(m) <= DASHBOARD_MOTION_MAX_UNLOCK_INTIMACY_LEVEL;
  });
}

function collectMotionAssetUrlsFromRows(rows) {
  if (!Array.isArray(rows)) return [];
  const seen = new Set();
  const out = [];
  for (const m of rows) {
    if (!m || motionTagTrim(m) === '잠금') continue;
    const u = normalizeMotionAssetUrl(m.assetUrl ?? m.asset_url);
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

/** 대시보드 무대용: L2 이하 해금 모션(+기본) 에셋 URL만 */
export function collectDashboardStageMotionAssetUrls(motions) {
  return collectMotionAssetUrlsFromRows(filterMotionsForDashboardStage(motions));
}

/** 채팅: 친밀 레벨 기준으로 해금된 모션만 (잠금 제외 + unlock ≤ userIntimacyLevel) */
export function filterMotionsForChatUnlockedLevel(motions, userIntimacyLevel) {
  if (!Array.isArray(motions)) return [];
  const lv = Number(userIntimacyLevel);
  const useCap = Number.isFinite(lv) && lv >= 1;
  const cap = useCap ? lv : Number.POSITIVE_INFINITY;
  return motions.filter((m) => {
    if (!m || motionTagTrim(m) === '잠금') return false;
    if (!useCap) return true;
    return motionUnlockIntimacyLevel(m) <= cap;
  });
}

function motionCodeFromRow(m) {
  return String(m?.motionCode ?? m?.motion_code ?? '').trim().toUpperCase();
}

function pickAssetUrlForMotionCodes(motions, codes) {
  if (!Array.isArray(motions) || !Array.isArray(codes)) return '';
  for (const code of codes) {
    const c = String(code ?? '').trim().toUpperCase();
    if (!c) continue;
    const row = motions.find((m) => motionCodeFromRow(m) === c);
    if (!row || motionTagTrim(row) === '잠금') continue;
    const u = normalizeMotionAssetUrl(row.assetUrl ?? row.asset_url);
    if (u) return u;
  }
  return '';
}

/**
 * 채팅 아바타: 해금 범위 안에서만, 맥락에 맞는 모션 URL 선택.
 * @param {'empty'|'awaiting_reply'|'idle'} phase — idle: 직전 메시지가 봇 답장일 때(답장·직전 사용자 발화로 판단)
 */
export function pickChatMotionUrlForSituation(
  motions,
  userIntimacyLevel,
  { mateReplyText = '', userMessageText = '', phase = 'empty' } = {}
) {
  const list = filterMotionsForChatUnlockedLevel(motions, userIntimacyLevel);
  if (!list.length) return '';

  if (phase === 'empty') {
    const u = pickAssetUrlForMotionCodes(list, ['HELLO', 'WAITING', 'COMPLIMENTS']);
    return u || normalizeMotionAssetUrl(list[0].assetUrl ?? list[0].asset_url);
  }

  if (phase === 'awaiting_reply') {
    const fromUser = String(userMessageText ?? '').toLowerCase();
    const uSit = pickSituationMotionFromScan(list, fromUser);
    if (uSit) return uSit;
    const u = pickAssetUrlForMotionCodes(list, ['WAITING', 'HELLO', 'COMPLIMENTS']);
    return u || normalizeMotionAssetUrl(list[0].assetUrl ?? list[0].asset_url);
  }

  const scan = `${String(mateReplyText ?? '')}\n${String(userMessageText ?? '')}`.toLowerCase();
  const uSit = pickSituationMotionFromScan(list, scan);
  if (uSit) return uSit;
  const u = pickAssetUrlForMotionCodes(list, ['HELLO', 'WAITING', 'COMPLIMENTS', 'CURIOSITY', 'STRETCH']);
  return u || normalizeMotionAssetUrl(list[0].assetUrl ?? list[0].asset_url);
}

/** 한글 톤 위주로 motion_code 후보를 정해 첫 매칭 에셋 반환 */
function pickSituationMotionFromScan(motions, scanLower) {
  const s = String(scanLower ?? '').toLowerCase();
  if (!s.trim()) return '';

  const rules = [
    { codes: ['WORRY'], test: /걱정|불안|초조|두려|무섭|긴장|조마조마/ },
    { codes: ['TEARS'], test: /눈물|울었|슬픔|슬퍼|우울|서러|서럽/ },
    { codes: ['ANGER'], test: /화가|짜증|열받|분노|빡|약올라|억울/ },
    { codes: ['CURIOSITY'], test: /궁금|왜 그런|어떻게 된|이유가|알고 싶/ },
    { codes: ['COMPLIMENTS'], test: /잘했|대단|멋져|훌륭|칭찬|자랑스|축하|응원|파이팅/ },
    { codes: ['STRETCH'], test: /기지개|쉬어|편안|느긋|천천히|호흡/ },
    { codes: ['WAITING'], test: /기다릴|여기 있|곁에|언제든|들을게|말해줘/ },
    { codes: ['HELLO'], test: /안녕|반가|오랜만|왔네|하이|hello|\bhi\b/ },
  ];

  for (const { codes, test } of rules) {
    if (test.test(s)) {
      const u = pickAssetUrlForMotionCodes(motions, codes);
      if (u) return u;
    }
  }
  return '';
}

export function pickRandomMotionAssetUrl(urls, avoidUrl) {
  if (!Array.isArray(urls) || urls.length === 0) return '';
  if (urls.length === 1) return urls[0];
  let pick = urls[Math.floor(Math.random() * urls.length)];
  let n = 0;
  while (pick === avoidUrl && n < 12) {
    pick = urls[Math.floor(Math.random() * urls.length)];
    n += 1;
  }
  return pick;
}
