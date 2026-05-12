import {
  MATES,
  MATE_IMAGES,
  MATE_QUICK_CHIPS,
  MATE_ABILITIES,
  MATE_RECOMMEND_KEY,
  resolveMateKey,
  MATE_NAMES,
  getDefaultCardStatsForMateKey,
} from '../constants/mates';

/** BOT.card_stats_json 만 파싱해 홈 카드 막대용 stats 로 씁니다. 없거나 잘못되면 빈 배열 */
function parseDbCardStatsOnly(row) {
  const raw = row?.cardStatsJson ?? row?.card_stats_json;
  const s = raw == null ? '' : String(raw).trim();
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    if (!Array.isArray(arr)) return [];
    const out = [];
    for (const x of arr.slice(0, 8)) {
      if (!x || typeof x !== 'object') continue;
      const label = String(x.label ?? '').trim();
      let v = Number(x.value);
      if (!label || !Number.isFinite(v)) continue;
      v = Math.max(0, Math.min(100, Math.round(v)));
      out.push({ label, value: v });
    }
    return out;
  } catch {
    return [];
  }
}

/** DB에 막대 JSON이 없을 때: mates.js 기본 능력치(MATE_STATS) 사용 */
function resolveLandingCardStats(row, mateKey) {
  const fromDb = parseDbCardStatsOnly(row);
  if (fromDb.length > 0) return fromDb;
  return getDefaultCardStatsForMateKey(mateKey);
}

/** 랜딩 API 실패·빈 배열: MATES 그대로(이미 stats 포함) */
function matesFromStaticDefaults() {
  return MATES.map((m) => ({ ...m }));
}

function truncate(s, max) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

const FALLBACK_ACCENTS = ['is-dog', 'is-bear', 'is-cat'];

/** BOT.avatar_image 값 → img src (대시보드와 동일 규칙) */
export function resolveLandingBotAvatarUrl(raw, keyFallback) {
  const v = String(raw ?? '').trim();
  if (v) {
    if (v.startsWith('data:')) return v;
    if (v.startsWith('http://') || v.startsWith('https://')) return v;
    return v.startsWith('/') ? v : `/${v}`;
  }
  const k = String(keyFallback || '').trim().toLowerCase();
  return MATE_IMAGES[k] || '/images/mypage/bot/matey-base.png';
}

/**
 * GET /api/community/bots/landing 행 → Home / Chat 에서 쓰는 MATES 형태로 병합
 * 능력치 막대(stats): DB card_stats_json 우선, 비어 있으면 mates.js 기본(MATE_STATS).
 */
export function mergeLandingBotsRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return matesFromStaticDefaults();
  }
  const out = rows
    .map((row, idx) => {
      const key = resolveMateKey(row.name ?? '');
      if (!key || key === 'hamster') return null;
      const base = MATES.find((m) => m.key === key);
      const image = resolveLandingBotAvatarUrl(row.avatarImage ?? row.avatar_image, key);
      const roleSrc = String(row.selectionPreview ?? row.selection_preview ?? '').trim();
      const desc = String(row.description ?? '').trim();
      const dbLabel = String(row.displayName ?? row.display_name ?? '').trim();
      const displayName = dbLabel || MATE_NAMES[key] || String(row.name ?? key).trim();
      const stats = resolveLandingCardStats(row, key);
      if (base) {
        return {
          ...base,
          image,
          role: truncate(roleSrc, 120) || base.role,
          headline: truncate(desc, 160) || base.headline,
          description: desc || base.description,
          name: displayName,
          stats,
        };
      }
      const accent = FALLBACK_ACCENTS[Math.abs(Number(row.botId ?? idx + 1)) % FALLBACK_ACCENTS.length];
      return {
        key,
        image,
        name: displayName,
        role: truncate(roleSrc, 100) || '상담봇',
        headline: truncate(desc, 180) || '편하게 이야기 나눠요.',
        description: desc || '',
        bubble: '안녕! 오늘은 어떤 하루였어요?',
        greeting: desc || '편하게 말 걸어 주세요.',
        quickChips: MATE_QUICK_CHIPS.dog,
        tagline: '함께해요.',
        accent,
        tags: ['대화', '상담', '곁에'],
        stats,
        abilities: MATE_ABILITIES.dog,
        isRecommended: key === MATE_RECOMMEND_KEY,
      };
    })
    .filter(Boolean);
  return out.length ? out : matesFromStaticDefaults();
}
