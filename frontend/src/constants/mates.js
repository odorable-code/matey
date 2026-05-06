/**
 * =========================================================
 * 파일명 : src/constants/mates.js
 * 역할   : 메이트(봇) 공통 데이터 모듈
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 모든 메이트의 이미지/이름/역할/소개/한마디/태그/스탯/능력치를
 *   한 곳에서 관리
 * - Hero, HomePage, ChatModal 등에서 import 해서 사용
 *
 * [이번 수정 핵심]
 * - MATE_STATS 복원 (HomePage 카드용 4개 항목 막대 그래프)
 * - MATE_ABILITIES 추가 (ChatModal 게임 픽 화면용 4축 능력치)
 *   * empathy(공감형) / realistic(현실형) / cheer(응원형) / safe(안심형)
 *
 * [수정 포인트]
 * - 캐릭터 이름 확정 시 MATE_NAMES 만 수정
 * - HomePage 카드 stat 밸런싱 시 MATE_STATS 수정
 * - ChatModal 픽 화면 능력치 밸런싱 시 MATE_ABILITIES 수정
 * =========================================================
 */

// ============================================================
// 1. 이미지 경로
// ============================================================
const MASCOT_BASE_PATH = '/images/mascots';

export const MATE_IMAGES = {
  dog: `${MASCOT_BASE_PATH}/dog.png`,
  bear: `${MASCOT_BASE_PATH}/bear.png`,
  cat: `${MASCOT_BASE_PATH}/cat.png`,
  hamster: `${MASCOT_BASE_PATH}/hamster.png`,
};

// ============================================================
// 2. 이름 / 역할 / 헤드라인 / 설명
// ============================================================
export const MATE_NAMES = {
  dog: '메이트 A',
  bear: '메이트 B',
  cat: '메이트 C',
  hamster: '메이트 D',
};

export const MATE_ROLES = {
  dog: '다정한 시작형',
  bear: '차분한 정리형',
  cat: '또렷한 분석형',
  hamster: '포근한 안심형',
};

export const MATE_HEADLINES = {
  dog: '처음 말을 꺼내기 쉬운 다정한 시작형',
  bear: '복잡한 마음을 차분히 정리해주는 타입',
  cat: '핵심만 빠르게 짚어주는 또렷한 타입',
  hamster: '망설이는 마음을 다독여주는 안심형',
};

export const MATE_DESCRIPTIONS = {
  dog: '처음 접속한 사용자가 부담 없이 대화를 시작할 수 있도록 편안하고 따뜻한 분위기로 안내해요.',
  bear: '머릿속이 엉켜 있을 때 흐름을 차분히 풀어내고 핵심을 정돈해주는 메이트예요.',
  cat: '질문이 많거나 헷갈리는 게 있을 때, 중요한 포인트를 빠르게 짚어주는 메이트예요.',
  hamster: '걱정이 많거나 말 꺼내기 조심스러울 때, 부드러운 낮춤 톤으로 천천히 곁에 있어줘요.',
};

// ============================================================
// 3. 한마디 / 자기소개 / 빠른시작 칩
// ============================================================
export const MATE_BUBBLES = {
  dog: '안녕! 어떤 하루였어요?',
  bear: '복잡한 마음, 같이 정리해볼까요?',
  cat: '핵심만 또렷하게 짚어줄게요.',
  hamster: '괜찮아요, 곁에 있을게요.',
};

export const MATE_GREETINGS = {
  dog: '저는 가볍게 말 걸기 좋은 다정한 시작형이에요. 오늘 어떤 이야기든 편하게 들려줘요.',
  bear: '머릿속을 차근히 풀어주는 차분한 정리형이에요. 엉킨 생각, 같이 정돈해봐요.',
  cat: '필요한 것만 또렷하게 짚어드리는 분석형이에요. 무엇이 가장 궁금한가요?',
  hamster: '말 꺼내기 어려울 때 곁에 있는 안심형이에요. 천천히, 한 줄이면 충분해요.',
};

export const MATE_QUICK_CHIPS = {
  dog: ['오늘 하루 어땠는지 듣고 싶어요', '그냥 수다 떨어요', '응원이 필요해요'],
  bear: ['생각 정리 도와줘요', '결정이 어려워요', '한 가지 고민이 있어요'],
  cat: ['핵심만 빠르게 정리해줘요', '뭐부터 해야 할지 모르겠어요', '요약해줘요'],
  hamster: ['말 꺼내기가 어려워요', '그냥 곁에 있어줘요', '오늘 너무 지쳤어요'],
};

// ============================================================
// 4. 추천 / 태그 / 액센트
// ============================================================
export const MATE_RECOMMEND_KEY = 'dog';

export const MATE_TAGLINES = {
  dog: '가볍게 시작하기 좋아요.',
  bear: '천천히 정리해봐요.',
  cat: '핵심부터 짚어줄게요.',
  hamster: '곁에 머물러 줄게요.',
};

export const MATE_ACCENTS = {
  dog: 'is-dog',
  bear: 'is-bear',
  cat: 'is-cat',
  hamster: 'is-hamster',
};

export const MATE_TAGS = {
  dog: ['친근함', '가벼운 시작', '초보자 추천'],
  bear: ['차분함', '정리형', '설명력'],
  cat: ['핵심 요약', '또렷함', '빠른 이해'],
  hamster: ['안정감', '부드러움', '불안 완화'],
};

// ============================================================
// 5. HomePage 카드용 스탯 (4개 항목 막대 그래프)
//    - 카드마다 라벨이 살짝 다름 (성격 강조)
// ============================================================
export const MATE_STATS = {
  dog: [
    { label: '공감력', value: 92 },
    { label: '친근함', value: 95 },
    { label: '시작 편안함', value: 90 },
    { label: '부드러움', value: 88 },
  ],
  bear: [
    { label: '공감력', value: 84 },
    { label: '친근함', value: 78 },
    { label: '분석력', value: 91 },
    { label: '정리력', value: 94 },
  ],
  cat: [
    { label: '공감력', value: 76 },
    { label: '친근함', value: 72 },
    { label: '분석력', value: 96 },
    { label: '명확함', value: 93 },
  ],
  hamster: [
    { label: '공감력', value: 94 },
    { label: '친근함', value: 90 },
    { label: '분석력', value: 70 },
    { label: '포근함', value: 96 },
  ],
};

// ============================================================
// 6. ChatModal 게임 픽 화면용 4축 능력치
//    - empathy   : 공감형 (들어주고 마음 알아주기)
//    - realistic : 현실형 (현실적 조언과 분석)
//    - cheer     : 응원형 (북돋우고 동기 부여)
//    - safe      : 안심형 (불안 완화, 곁에 있어주기)
// ============================================================
export const ABILITY_AXES = [
  { key: 'empathy',   label: '공감형', color: '#8f79ff' },
  { key: 'realistic', label: '현실형', color: '#6ebeff' },
  { key: 'cheer',     label: '응원형', color: '#ffa37a' },
  { key: 'safe',      label: '안심형', color: '#ff93b7' },
];

export const MATE_ABILITIES = {
  dog:     { empathy: 88, realistic: 60, cheer: 92, safe: 78 },
  bear:    { empathy: 80, realistic: 92, cheer: 70, safe: 76 },
  cat:     { empathy: 62, realistic: 96, cheer: 70, safe: 60 },
  hamster: { empathy: 90, realistic: 55, cheer: 74, safe: 96 },
};

// ============================================================
// 7. 키 배열 / MATES 배열
// ============================================================
export const MATE_KEYS = ['dog', 'bear', 'cat', 'hamster'];

export const MATES = MATE_KEYS.map((key) => ({
  key,
  image: MATE_IMAGES[key],
  name: MATE_NAMES[key],
  role: MATE_ROLES[key],
  headline: MATE_HEADLINES[key],
  description: MATE_DESCRIPTIONS[key],
  bubble: MATE_BUBBLES[key],
  greeting: MATE_GREETINGS[key],
  quickChips: MATE_QUICK_CHIPS[key],
  tagline: MATE_TAGLINES[key],
  accent: MATE_ACCENTS[key],
  tags: MATE_TAGS[key],
  // HomePage 카드용 (label/value)
  stats: MATE_STATS[key],
  // ChatModal 픽 화면용 (4축)
  abilities: MATE_ABILITIES[key],
  isRecommended: key === MATE_RECOMMEND_KEY,
}));
