// 감정/상황 텍스트를 바탕으로 "보여줄 봇(메이트) 이미지"를 고릅니다.
// 이미지 파일은 public/images/mascots/ 아래를 사용합니다.

const MASCOT_BASE_PATH = '/images/mascots';

const normalize = (v) => String(v || '').trim().toLowerCase();

/**
 * 감정/상황 라벨 → 메이트 키 매핑
 * - hamster: 불안/걱정/긴장 등 "안심"이 필요한 상황
 * - bear: 지침/슬픔/회복 등 "위로/버팀"이 필요한 상황
 * - cat: 정리/분석/짜증/분노 등 "또렷한 정리"가 필요한 상황
 * - dog: 응원/기쁨/안정/공감 등 "가볍게 북돋기"가 필요한 상황
 */
export function resolveMateKeyBySituationLabel(label, fallbackKey = 'dog') {
  const s = normalize(label);
  if (!s) return fallbackKey;

  // 불안/걱정/긴장/무서움 류
  if (
    s.includes('불안') ||
    s.includes('걱정') ||
    s.includes('긴장') ||
    s.includes('초조') ||
    s.includes('무서') ||
    s.includes('두려')
  ) {
    return 'hamster';
  }

  // 슬픔/우울/지침/회복 류
  if (
    s.includes('슬픔') ||
    s.includes('우울') ||
    s.includes('눈물') ||
    s.includes('지침') ||
    s.includes('피곤') ||
    s.includes('회복')
  ) {
    return 'bear';
  }

  // 분노/짜증/정리/분석 류
  if (
    s.includes('분노') ||
    s.includes('화') ||
    s.includes('짜증') ||
    s.includes('정리') ||
    s.includes('분석') ||
    s.includes('현실')
  ) {
    return 'cat';
  }

  // 응원/기쁨/안정/공감 류
  if (
    s.includes('응원') ||
    s.includes('기쁨') ||
    s.includes('신남') ||
    s.includes('안정') ||
    s.includes('공감')
  ) {
    return 'dog';
  }

  return fallbackKey;
}

export function resolveMascotImageSrcBySituationLabel(label, fallbackKey = 'dog') {
  const key = resolveMateKeyBySituationLabel(label, fallbackKey);
  return `${MASCOT_BASE_PATH}/${key}.png`;
}

