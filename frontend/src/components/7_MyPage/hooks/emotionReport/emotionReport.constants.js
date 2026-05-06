/**
 * [파일 역할]
 * - 감정 리포트 전체에서 쓰이는 "고정된 값"을 한 곳에 모아둔 파일
 * - 탭 이름, 기간 버튼, 캐릭터 정보, 이미지 경로 등
 *
 * [여기서 찾을 것]
 * - 탭 목록: DEFAULT_TAB_OPTIONS
 * - 기간 목록: DEFAULT_PERIOD_OPTIONS
 * - 캐릭터 이미지 경로: CHARACTER_IMAGE_MAP
 * - 캐릭터 기본 데이터: FALLBACK_HERO_BOTS
 * - 요일 라벨: WEEKDAY_LABELS
 * - 기본 연도: CURRENT_YEAR
 *
 * [수정 포인트]
 * - 탭 이름 바꾸기: DEFAULT_TAB_OPTIONS
 * - 기간 버튼 문구 바꾸기: DEFAULT_PERIOD_OPTIONS
 * - 캐릭터 이름/색상/설명 바꾸기: FALLBACK_HERO_BOTS
 * - 캐릭터 이미지 파일 바꾸기: CHARACTER_IMAGE_MAP
 *
 * [주의]
 * - 이 파일은 "값"만 있고, 함수는 없음
 * - 함수는 emotionReport.utils.js에 모아둠
 * - 이 파일을 수정하면 감정 리포트 전체에 반영됨
 */

/* =========================
   날짜 관련 기본값
   - "04-21" 같은 값이 들어오면 이 연도 기준으로 해석
========================= */
export const CURRENT_YEAR = 2026;

/* =========================
   달력에 표시할 요일 라벨
========================= */
export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/* =========================
   탭 목록
   - 감정 리포트 화면 상단에 보이는 탭 버튼들
   - key: 코드에서 구분할 때 쓰는 값
   - label: 화면에 보이는 텍스트
========================= */
export const DEFAULT_TAB_OPTIONS = [
  { key: 'emotion', label: '감정 리포트' },
  { key: 'history', label: '대화 히스토리' },
];

/* =========================
   기간 선택 목록
   - 감정 리포트 탭에서 보이는 기간 버튼들
   - key: 서버에 보낼 값 (예: '7d')
   - label: 화면에 보이는 텍스트 (예: '최근 7일')
========================= */
export const DEFAULT_PERIOD_OPTIONS = [
  { key: '7d', label: '최근 7일' },
  { key: '30d', label: '최근 30일' },
  { key: '90d', label: '최근 90일' },
];

/* =========================
   캐릭터 이미지 경로
   - 캐릭터 key에 대응하는 이미지 파일 위치
   - 이미지 파일을 바꾸려면 여기만 수정하면 됨
========================= */
export const CHARACTER_IMAGE_MAP = {
  cat: '/images/emotion-report/cat.png',
  bear: '/images/emotion-report/bear.png',
  dog: '/images/emotion-report/dog.png',
  hamster: '/images/emotion-report/hamster.png',
};

/* =========================
   대표 캐릭터 기본 데이터
   - 감정 리포트에서 쓰이는 4마리 캐릭터 정보
   - 이름, 색상, 설명, 요약 문장, 키워드 칩 등 포함
   *
   * 각 필드 설명:
   * - key: 코드에서 이 캐릭터를 구분하는 고유값
   * - name: 화면에 표시되는 이름
   * - typeLabel: 캐릭터 성격 한줄 설명
   * - fallbackLabel: 이미지가 없을 때 대신 보여줄 글자
   * - accentColor: 이 캐릭터의 대표 색상
   * - softColor: 이 캐릭터의 연한 배경 색상
   * - imageUrl: 캐릭터 이미지 경로
   * - cardObjectPosition: 카드에서 이미지 위치 조정값
   * - reportObjectPosition: 리포트에서 이미지 위치 조정값
   * - title: 리포트 제목
   * - summary: 리포트 요약 한 문단
   * - bullets: 리포트 핵심 포인트 3줄
   * - chips: 키워드 칩 (태그처럼 보이는 것)
========================= */
export const FALLBACK_HERO_BOTS = [
  {
    key: 'cat',
    name: '냥이',
    typeLabel: '직설형 리포터',
    fallbackLabel: '냥',
    accentColor: '#9A85FF',
    softColor: '#F2ECFF',
    imageUrl: CHARACTER_IMAGE_MAP.cat,
    cardObjectPosition: 'center 14%',
    reportObjectPosition: 'center bottom',
    title: '냥이 피드백',
    summary:
      '감정을 크게 보기보다 어디서 흔들렸는지 먼저 짚어야 해.',
    bullets: [
      '결과 불안이 감정보다 먼저 커지는 흐름이 보여.',
      '비교가 시작되면 자책으로 이어지는 패턴이 있어.',
      '기준을 조금 낮추면 전체 감정 흐름이 가벼워질 수 있어.',
    ],
    chips: ['현실 점검', '자책 교정', '기준 재정비'],
  },
  {
    key: 'bear',
    name: '곰이',
    typeLabel: '든든한 위로형',
    fallbackLabel: '곰',
    accentColor: '#F3A55C',
    softColor: '#FFF1E4',
    imageUrl: CHARACTER_IMAGE_MAP.bear,
    cardObjectPosition: 'center 18%',
    reportObjectPosition: 'center bottom',
    title: '곰이 리포트',
    summary:
      '지친 날에는 더 잘하려 하기보다 먼저 버티는 마음을 안아줘야 해.',
    bullets: [
      '무거운 날에도 다시 돌아오려는 힘이 있어.',
      '해결보다 안정이 먼저 필요한 날이 보여.',
      '자기비판을 줄이면 회복도 조금 더 빨라질 수 있어.',
    ],
    chips: ['안정감', '버팀', '따뜻한 위로'],
  },
  {
    key: 'dog',
    name: '강아지',
    typeLabel: '공감·응원형',
    fallbackLabel: '강',
    accentColor: '#7DBBF7',
    softColor: '#ECF6FF',
    imageUrl: CHARACTER_IMAGE_MAP.dog,
    cardObjectPosition: 'center 16%',
    reportObjectPosition: 'center bottom',
    title: '강아지 리포트',
    summary:
      '큰 결론보다 작은 실행 하나를 같이 잡아주는 게 중요해 보여.',
    bullets: [
      '불안이 올라와도 다시 움직이려는 흐름이 있어.',
      '혼자 다 해결하려 할수록 부담이 커질 수 있어.',
      '작게 시작하면 훨씬 덜 무겁게 움직일 수 있어.',
    ],
    chips: ['공감', '응원', '작은 실행'],
  },
  {
    key: 'hamster',
    name: '햄이',
    typeLabel: '세심한 생활형',
    fallbackLabel: '햄',
    accentColor: '#C6A5FF',
    softColor: '#F4EEFF',
    imageUrl: CHARACTER_IMAGE_MAP.hamster,
    cardObjectPosition: 'center 12%',
    reportObjectPosition: 'center bottom',
    title: '햄이 리포트',
    summary:
      '감정이 생활 리듬과 같이 흔들리는 패턴이 보여.',
    bullets: [
      '수면이나 루틴이 흔들리면 감정 반응도 커져.',
      '작은 루틴 하나만 안정돼도 흐름이 정돈될 수 있어.',
      '거창한 다짐보다 생활 단위 회복이 더 중요해.',
    ],
    chips: ['루틴', '생활 정리', '잔잔한 회복'],
  },
];
