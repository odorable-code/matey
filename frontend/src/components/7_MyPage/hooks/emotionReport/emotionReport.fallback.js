/**
 * [파일 역할]
 * - 아직 서버(API)가 연결되기 전에 화면에 보여줄 더미 데이터를 모아둔 파일
 * - 서버가 연결되면 이 파일의 데이터는 "서버 응답이 없을 때의 기본값"으로만 사용됨
 *
 * [여기서 찾을 것]
 * - 감정 리포트 전체 더미: FALLBACK_REPORT_DATA
 * - 대화 히스토리 전체 더미: FALLBACK_CHAT_HISTORY_DATA
 * - 감정 탭 전용 더미: FALLBACK_EMOTION_DATA
 * - 기본 하루치 대화방 더미: FALLBACK_DAY_DATA (byDate에서 하나 꺼낸 것)
 *
 * [수정 포인트]
 * - 더미 문구/숫자/카드 내용 바꾸기: 아래 객체 안에서 직접 수정
 * - 날짜 추가/삭제: FALLBACK_CHAT_HISTORY_DATA.byDate 에서 추가/삭제
 *
 * [주의]
 * - 이 파일은 "데이터"만 있고, 함수나 로직은 없음
 * - 상수는 emotionReport.constants.js
 * - 함수는 emotionReport.utils.js
 * - 서버 연결 후에도 fallback으로 남겨두면 에러 화면 방지에 도움이 됨
 */

import {
  DEFAULT_TAB_OPTIONS,
  DEFAULT_PERIOD_OPTIONS,
  FALLBACK_HERO_BOTS,
  CHARACTER_IMAGE_MAP,
} from './emotionReport.constants';

/* =========================
   감정 리포트 탭 전용 더미 데이터
   - EmotionTab.jsx에서 사용
   - 통계 카드, 핵심 감정, 감정 분포, 주제 태그, 타임라인 포함
========================= */
export const FALLBACK_EMOTION_DATA = {
  heroBots: FALLBACK_HERO_BOTS,
  selectedHero: FALLBACK_HERO_BOTS[0],

  /* --- 통계 카드 4장 --- */
  statCards: [
    {
      id: 'conversation-count',
      label: '대화량',
      value: '12회',
      caption: '선택 기간 동안 기록된 대화 횟수',
    },
    {
      id: 'stability',
      label: '안정도',
      value: '77%',
      caption: '감정이 급격히 무너지지 않은 흐름',
    },
    {
      id: 'recovery',
      label: '회복도',
      value: '74%',
      caption: '감정이 다시 정리되는 힘',
    },
    {
      id: 'acceptance',
      label: '자기수용',
      value: '73%',
      caption: '자책보다 수용으로 이동한 흐름',
    },
  ],

  /* --- 핵심 감정 해석 --- */
  coreEmotion: {
    title: '복잡한 감정이 생활 리듬과 연결되어 나타나는 패턴이 보여요.',
    description:
      '하루 루틴이 흔들릴 때 감정 반응도 함께 커지는 흐름이 보여서, 마음과 생활 리듬을 같이 정리할 필요가 있어 보여요.',
    tags: ['루틴', '불안', '회복', '집중'],
  },

  /* --- 감정 분포 도넛 차트 --- */
  emotionDistribution: {
    total: 12,
    items: [
      { label: '불안', value: 28, color: '#9A85FF', description: '압박과 걱정이 높았던 구간' },
      { label: '회복', value: 26, color: '#F2C94C', description: '다시 정리되는 흐름' },
      { label: '안정', value: 24, color: '#7ED4C7', description: '감정이 가라앉은 장면' },
      { label: '계획', value: 22, color: '#FFB38A', description: '정리와 실행으로 이어진 흐름' },
    ],
  },

  /* --- 자주 나온 주제 태그 --- */
  topicTags: ['시험', '비교', '불안', '미래', '회복', '루틴', '위로'],

  /* --- 요약 타임라인 --- */
  summaryTimeline: [
    {
      id: 1,
      title: '시험 결과와 비교 불안이 자주 등장한 날',
      description: '외부 기준 때문에 스스로를 과하게 평가한 장면이 있었어요.',
    },
    {
      id: 2,
      title: '지친 마음을 위로받고 싶어한 날',
      description: '해결보다 먼저 감정을 이해받고 싶은 흐름이 보였어요.',
    },
    {
      id: 3,
      title: '생활 리듬 정리가 더 필요했던 날',
      description: '수면과 루틴이 흔들리며 감정 반응도 같이 커졌어요.',
    },
  ],
};

/* =========================
   대화 히스토리 탭 전용 더미 데이터
   - ChatHistoryTab.jsx에서 사용
   - 날짜별 대화방, 대화 기록, 메모, 인사이트, 봇 해석 포함
   *
   * [구조 설명]
   * - dateOptions: 선택 가능한 날짜 목록
   * - heroBots: 대화방에서 쓰이는 캐릭터 목록
   * - byDate: 날짜별 대화방 데이터 (핵심)
   *   - byDate['04-21'].chatRooms[0]: 4월 21일의 첫 번째 대화방
========================= */
export const FALLBACK_CHAT_HISTORY_DATA = {
  /* --- 선택 가능한 날짜 --- */
  dateOptions: [
    { key: '04-21', label: '4월 21일' },
    { key: '04-22', label: '4월 22일' },
    { key: '04-23', label: '4월 23일' },
    { key: '04-24', label: '4월 24일' },
    { key: '04-25', label: '4월 25일' },
  ],

  /* --- 대화방에서 쓰이는 캐릭터 --- */
  heroBots: FALLBACK_HERO_BOTS,

  /* --- 날짜별 대화방 데이터 --- */
  byDate: {
    /* ========== 4월 21일 ========== */
    '04-21': {
      chatRooms: [
        {
          id: 'room-cat-0421',
          botKey: 'cat',
          title: '냥이와의 대화',
          lastMessage: '오늘은 비교를 멈추는 기준 하나만 정해보자.',
          lastTime: '09:18',
          summary: {
            title: '메모와 대화 흐름이 같이 남아 있는 하루예요.',
            description:
              '해결을 서두르기보다 먼저 감정을 정리하고, 그 다음에 작은 계획으로 넘어가려는 흐름이 보여요.',
            chips: ['불안 완화', '작은 계획', '위로 필요'],
          },
          overviewCards: [
            { id: 'conversation-count', label: '대화 조각', value: '8개', caption: '선택한 날짜에 남은 주요 대화 기록' },
            { id: 'memo-count', label: '메모 수', value: '3개', caption: '감정 메모와 핵심 포인트' },
            { id: 'dominant-emotion', label: '주 감정', value: '불안', caption: '가장 강하게 반복된 감정 톤' },
            { id: 'focus-topic', label: '집중 주제', value: '시험', caption: '대화에서 많이 다뤄진 주제' },
          ],
          chatEntries: [
            { id: 1, time: '09:12', speaker: 'me', emotion: '불안', message: '시험 결과가 생각보다 잘 안 나와서 계속 신경 쓰여.' },
            { id: 2, time: '09:13', speaker: 'bot', emotion: '공감', message: '결과 자체보다 "내가 뒤처진 것 같다"는 느낌이 더 크게 남은 것 같아.' },
            { id: 3, time: '09:16', speaker: 'me', emotion: '비교', message: '주변 친구들하고 비교하게 돼서 더 마음이 무거워.' },
            { id: 4, time: '09:18', speaker: 'bot', emotion: '정리', message: '비교가 시작되면 감정보다 자책이 먼저 커지는 흐름이 보여. 오늘은 비교를 멈추는 기준 하나만 정해보자.' },
          ],
          noteCards: [
            { id: 'memo-1', title: '메모 01', description: '결과보다 비교 때문에 감정이 더 흔들렸다고 느낀 날.' },
            { id: 'memo-2', title: '메모 02', description: '해결책보다 "이해받고 싶다"는 욕구가 더 크게 올라온 흐름.' },
            { id: 'memo-3', title: '메모 03', description: '밤이 될수록 피로와 자책이 함께 올라오는 패턴이 보였음.' },
          ],
          insight: {
            headline: '이 날의 대화는 "비교 → 자책 → 위로 필요" 흐름으로 이어졌어요.',
            description: '감정 자체를 없애려 하기보다, 비교가 시작되는 지점을 먼저 알아차리는 게 더 중요해 보여요.',
            meta: [
              { label: '반복 패턴', value: '비교 후 자책' },
              { label: '회복 포인트', value: '작은 기준 재설정' },
              { label: '추천 포커스', value: '밤 루틴 가볍게 정리' },
            ],
            tags: ['비교', '자책', '위로', '회복'],
          },
          botInterpretation: {
            summary: '감정이 커진 원인은 결과 자체보다, 스스로를 평가하는 기준이 갑자기 높아진 데 있어 보여요.',
            bullets: [
              '비교가 시작되면 감정이 빠르게 무거워지는 패턴이 반복돼요.',
              '하루 후반으로 갈수록 피로와 감정 반응이 같이 올라와요.',
              '해결보다 안정이 먼저 필요한 날로 해석할 수 있어요.',
            ],
          },
        },
        {
          id: 'room-bear-0421',
          botKey: 'bear',
          title: '곰이와의 대화',
          lastMessage: '오늘은 잘 버틴 날이야. 해결보다 먼저 쉬어도 괜찮아.',
          lastTime: '21:06',
          summary: {
            title: '지친 마음을 먼저 다독이려는 흐름이 보여요.',
            description: '해결책보다 위로와 안정이 먼저 필요했던 날로 보여요.',
            chips: ['위로', '안정', '회복 필요'],
          },
          overviewCards: [
            { id: 'conversation-count', label: '대화 조각', value: '6개', caption: '선택한 날짜에 남은 주요 대화 기록' },
            { id: 'memo-count', label: '메모 수', value: '2개', caption: '감정 메모와 핵심 포인트' },
            { id: 'dominant-emotion', label: '주 감정', value: '피로', caption: '가장 강하게 반복된 감정 톤' },
            { id: 'focus-topic', label: '집중 주제', value: '휴식', caption: '대화에서 많이 다뤄진 주제' },
          ],
          chatEntries: [
            { id: 1, time: '21:01', speaker: 'me', emotion: '피로', message: '오늘은 하루 종일 버틴 느낌이라 너무 지쳐.' },
            { id: 2, time: '21:03', speaker: 'bot', emotion: '위로', message: '오늘은 잘 버틴 날이야. 해결보다 먼저 쉬어도 괜찮아.' },
            { id: 3, time: '21:05', speaker: 'me', emotion: '무기력', message: '쉬어도 괜히 죄책감이 들어서 편하게 못 쉬겠어.' },
            { id: 4, time: '21:06', speaker: 'bot', emotion: '안정', message: '오늘 쉬는 건 포기가 아니라, 다시 버틸 힘을 만드는 시간이야.' },
          ],
          noteCards: [
            { id: 'memo-1', title: '메모 01', description: '몸과 마음이 먼저 지쳐 있었던 흐름.' },
            { id: 'memo-2', title: '메모 02', description: '휴식이 필요하지만 쉬는 것에도 죄책감을 느낌.' },
          ],
          insight: {
            headline: '이 날의 대화는 "피로 → 위로 필요 → 쉼 허용하기"로 이어졌어요.',
            description: '성과보다 회복을 우선순위에 두는 연습이 필요한 날처럼 보여요.',
            meta: [
              { label: '반복 패턴', value: '피로 후 죄책감' },
              { label: '회복 포인트', value: '휴식 허용' },
              { label: '추천 포커스', value: '마감 루틴 단순화' },
            ],
            tags: ['피로', '휴식', '위로', '회복'],
          },
          botInterpretation: {
            summary: '오늘은 해결하려고 애쓰기보다, 지친 마음을 안전하게 내려놓는 게 더 중요해 보여요.',
            bullets: [
              '지친 날일수록 자기비판이 같이 올라오는 패턴이 보여요.',
              '회복은 미루는 것이 아니라 다음 움직임을 위한 준비예요.',
              '오늘의 핵심은 생산성보다 안정이에요.',
            ],
          },
        },
      ],
    },

    /* ========== 4월 22일 ========== */
    '04-22': {
      chatRooms: [
        {
          id: 'room-dog-0422',
          botKey: 'dog',
          title: '강아지와의 대화',
          lastMessage: '작게 시작하면 훨씬 덜 무겁게 다시 움직일 수 있어.',
          lastTime: '08:41',
          summary: {
            title: '감정이 무거워도 다시 움직이려는 마음이 남아 있는 날이에요.',
            description: '불안과 걱정은 있었지만, 작게라도 다시 해보려는 의지가 대화 안에 드러났어요.',
            chips: ['응원', '작은 실행', '다시 시작'],
          },
          overviewCards: [
            { id: 'conversation-count', label: '대화 조각', value: '7개', caption: '선택한 날짜에 남은 주요 대화 기록' },
            { id: 'memo-count', label: '메모 수', value: '3개', caption: '감정 메모와 핵심 포인트' },
            { id: 'dominant-emotion', label: '주 감정', value: '걱정', caption: '가장 강하게 반복된 감정 톤' },
            { id: 'focus-topic', label: '집중 주제', value: '다시 시작', caption: '대화에서 많이 다뤄진 주제' },
          ],
          chatEntries: [
            { id: 1, time: '08:34', speaker: 'me', emotion: '걱정', message: '어제 못한 걸 오늘도 못할까 봐 걱정돼.' },
            { id: 2, time: '08:35', speaker: 'bot', emotion: '응원', message: '오늘은 다 해내는 것보다, 다시 시작했다는 사실이 더 중요해.' },
            { id: 3, time: '08:40', speaker: 'me', emotion: '의지', message: '그럼 진짜 작은 것 하나만 해볼까 싶어.' },
            { id: 4, time: '08:41', speaker: 'bot', emotion: '격려', message: '좋아. 작게 시작하면 훨씬 덜 무겁게 다시 움직일 수 있어.' },
          ],
          noteCards: [
            { id: 'memo-1', title: '메모 01', description: '불안은 있었지만 멈추지 않으려는 흐름이 보인 날.' },
            { id: 'memo-2', title: '메모 02', description: '큰 계획보다 작은 시작이 더 중요했던 날.' },
          ],
          insight: {
            headline: '이 날의 대화는 "걱정 → 다시 시도 → 작은 실행" 흐름으로 이어졌어요.',
            description: '성공보다 재시작 자체에 의미를 두는 태도가 도움이 되는 날이었어요.',
            meta: [
              { label: '반복 패턴', value: '걱정 후 시도' },
              { label: '회복 포인트', value: '작게 시작하기' },
              { label: '추천 포커스', value: '첫 행동 낮추기' },
            ],
            tags: ['걱정', '시도', '응원', '시작'],
          },
          botInterpretation: {
            summary: '완벽하게 하려는 부담보다, 다시 움직이려는 힘이 더 중요하게 보였어요.',
            bullets: [
              '작게 시작했을 때 감정 부담이 줄어드는 패턴이 보여요.',
              '응원과 지지가 행동으로 이어지는 연결이 있어요.',
              '오늘은 결과보다 재시작 자체를 인정해주는 게 중요해요.',
            ],
          },
        },
      ],
    },

    /* ========== 4월 23일 ========== */
    '04-23': {
      chatRooms: [
        {
          id: 'room-ham-0423',
          botKey: 'hamster',
          title: '햄이와의 대화',
          lastMessage: '오늘 감정은 생활 리듬 영향도 커 보여.',
          lastTime: '10:05',
          summary: {
            title: '생활 리듬이 감정에 직접 영향을 준 하루예요.',
            description: '수면과 하루 루틴이 흔들리면서 감정 기복도 함께 커졌어요.',
            chips: ['루틴', '생활 정리', '수면'],
          },
          overviewCards: [
            { id: 'conversation-count', label: '대화 조각', value: '5개', caption: '선택한 날짜에 남은 주요 대화 기록' },
            { id: 'memo-count', label: '메모 수', value: '2개', caption: '감정 메모와 핵심 포인트' },
            { id: 'dominant-emotion', label: '주 감정', value: '예민함', caption: '가장 강하게 반복된 감정 톤' },
            { id: 'focus-topic', label: '집중 주제', value: '수면', caption: '대화에서 많이 다뤄진 주제' },
          ],
          chatEntries: [
            { id: 1, time: '10:02', speaker: 'me', emotion: '예민함', message: '잠을 설쳐서 그런지 사소한 것도 다 거슬려.' },
            { id: 2, time: '10:05', speaker: 'bot', emotion: '정리', message: '오늘 감정은 마음 문제이기도 하지만, 생활 리듬 영향도 커 보여.' },
          ],
          noteCards: [
            { id: 'memo-1', title: '메모 01', description: '수면 부족이 감정 예민함으로 연결된 날.' },
            { id: 'memo-2', title: '메모 02', description: '큰 해결보다 루틴 회복이 우선인 흐름.' },
          ],
          insight: {
            headline: '이 날의 대화는 "수면 흔들림 → 예민함 증가" 흐름으로 이어졌어요.',
            description: '감정 해석과 함께 생활 리듬 점검이 같이 필요한 날이었어요.',
            meta: [
              { label: '반복 패턴', value: '수면 후 예민함' },
              { label: '회복 포인트', value: '루틴 복구' },
              { label: '추천 포커스', value: '취침 전 정리' },
            ],
            tags: ['수면', '루틴', '예민함', '정리'],
          },
          botInterpretation: {
            summary: '오늘의 감정은 생각보다 생활 리듬과 더 밀접하게 연결돼 있어 보여요.',
            bullets: [
              '생활 패턴이 흔들릴수록 감정 반응도 커져요.',
              '작은 루틴 회복이 전체 안정에 도움이 돼요.',
              '자기비난보다 생활 리듬 점검이 먼저예요.',
            ],
          },
        },
      ],
    },

    /* ========== 4월 24일 ========== */
    '04-24': {
      chatRooms: [
        {
          id: 'room-ham-0424',
          botKey: 'hamster',
          title: '햄이와의 대화',
          lastMessage: '오늘 감정은 마음 문제이기도 하지만 생활 리듬 영향도 커 보여.',
          lastTime: '10:05',
          summary: {
            title: '생활 리듬이 감정에 직접 영향을 준 하루예요.',
            description: '수면과 루틴이 흔들리면서 감정 기복도 함께 커졌어요.',
            chips: ['루틴', '생활 정리', '수면'],
          },
          overviewCards: [
            { id: 'conversation-count', label: '대화 조각', value: '5개', caption: '선택한 날짜에 남은 주요 대화 기록' },
            { id: 'memo-count', label: '메모 수', value: '2개', caption: '감정 메모와 핵심 포인트' },
            { id: 'dominant-emotion', label: '주 감정', value: '예민함', caption: '가장 강하게 반복된 감정 톤' },
            { id: 'focus-topic', label: '집중 주제', value: '수면', caption: '대화에서 많이 다뤄진 주제' },
          ],
          chatEntries: [
            { id: 1, time: '10:02', speaker: 'me', emotion: '예민함', message: '잠을 설쳐서 그런지 사소한 것도 다 거슬려.' },
            { id: 2, time: '10:05', speaker: 'bot', emotion: '정리', message: '오늘 감정은 마음 문제이기도 하지만, 생활 리듬 영향도 커 보여.' },
          ],
          noteCards: [
            { id: 'memo-1', title: '메모 01', description: '수면 부족이 감정 예민함으로 연결된 날.' },
            { id: 'memo-2', title: '메모 02', description: '큰 해결보다 루틴 회복이 우선인 흐름.' },
          ],
          insight: {
            headline: '이 날의 대화는 "수면 흔들림 → 예민함 증가" 흐름으로 이어졌어요.',
            description: '감정 해석과 함께 생활 리듬 점검이 같이 필요한 날이었어요.',
            meta: [
              { label: '반복 패턴', value: '수면 후 예민함' },
              { label: '회복 포인트', value: '루틴 복구' },
              { label: '추천 포커스', value: '취침 전 정리' },
            ],
            tags: ['수면', '루틴', '예민함', '정리'],
          },
          botInterpretation: {
            summary: '오늘의 감정은 생활 리듬과 더 밀접하게 연결돼 있어 보여요.',
            bullets: [
              '생활 패턴이 흔들릴수록 감정 반응도 커져요.',
              '작은 루틴 회복이 전체 안정에 도움이 돼요.',
              '자기비난보다 생활 리듬 점검이 먼저예요.',
            ],
          },
        },
      ],
    },

    /* ========== 4월 25일 ========== */
    '04-25': {
      chatRooms: [
        {
          id: 'room-cat-0425',
          botKey: 'cat',
          title: '냥이와의 대화',
          lastMessage: '기준을 현실적으로 조절하는 순간 감정 부담도 같이 줄어들 수 있어.',
          lastTime: '22:13',
          summary: {
            title: '감정을 정리하면서 현실적인 기준도 다시 세운 날이에요.',
            description: '막연한 불안을 줄이고 지금 할 수 있는 만큼만 해보려는 방향 전환이 있었어요.',
            chips: ['현실 점검', '기준 재설정', '감정 정리'],
          },
          overviewCards: [
            { id: 'conversation-count', label: '대화 조각', value: '6개', caption: '선택한 날짜에 남은 주요 대화 기록' },
            { id: 'memo-count', label: '메모 수', value: '3개', caption: '감정 메모와 핵심 포인트' },
            { id: 'dominant-emotion', label: '주 감정', value: '정리', caption: '가장 강하게 반복된 감정 톤' },
            { id: 'focus-topic', label: '집중 주제', value: '기준 조절', caption: '대화에서 많이 다뤄진 주제' },
          ],
          chatEntries: [
            { id: 1, time: '22:12', speaker: 'me', emotion: '정리', message: '오늘은 무조건 잘해야 한다는 생각을 조금 내려놔보려고 해.' },
            { id: 2, time: '22:13', speaker: 'bot', emotion: '해석', message: '좋아. 기준을 현실적으로 조절하는 순간 감정 부담도 같이 줄어들 수 있어.' },
          ],
          noteCards: [
            { id: 'memo-1', title: '메모 01', description: '과한 기준을 낮추며 숨통이 트인 날.' },
            { id: 'memo-2', title: '메모 02', description: '감정을 없애기보다 다루는 방향으로 바뀐 흐름.' },
            { id: 'memo-3', title: '메모 03', description: '현실 점검이 불안을 낮추는 데 도움이 됨.' },
          ],
          insight: {
            headline: '이 날의 대화는 "막연한 불안 → 기준 점검 → 감정 정리"로 이어졌어요.',
            description: '감정을 억누르기보다 기준을 조절하면서 현실적인 안정감을 만든 날이에요.',
            meta: [
              { label: '반복 패턴', value: '불안 후 기준 점검' },
              { label: '회복 포인트', value: '현실적인 기대치' },
              { label: '추천 포커스', value: '하루 마감 정리' },
            ],
            tags: ['정리', '불안 완화', '기준', '현실 점검'],
          },
          botInterpretation: {
            summary: '오늘은 감정에 끌려가기보다 스스로 기준을 조절하면서 안정을 찾으려는 흐름이 보였어요.',
            bullets: [
              '현실적인 기준 조절이 감정 부담을 줄였어요.',
              '막연한 불안이 정리 가능한 걱정으로 바뀌는 흐름이 있었어요.',
              '작은 정리가 큰 안정보다 먼저 도움이 되는 날이었어요.',
            ],
          },
        },
      ],
    },
  },
};

/* =========================
   FALLBACK_REPORT_DATA
   - useEmotionReport 훅에서 사용하는 전체 더미 데이터
   - 위에서 만든 FALLBACK_EMOTION_DATA와 FALLBACK_CHAT_HISTORY_DATA를 합친 것
   - 서버 데이터가 없을 때 이 값이 화면에 표시됨
========================= */
export const FALLBACK_REPORT_DATA = {
  /* --- 탭/기간 옵션 --- */
  tabOptions: DEFAULT_TAB_OPTIONS,
  periodOptions: DEFAULT_PERIOD_OPTIONS,

  /* --- 캐릭터 목록 --- */
  heroBots: FALLBACK_HERO_BOTS,

  /* --- 감정 리포트 탭 데이터 --- */
  emotionTab: FALLBACK_EMOTION_DATA,

  /* --- 대화 히스토리 탭 데이터 --- */
  chatHistoryTab: FALLBACK_CHAT_HISTORY_DATA,

  /* --- 히스토리 개요 카드 --- */
  historyOverview: {
    overviewCards: [
      { id: 'days', label: '기록 날짜', value: '5일', caption: '대화 히스토리가 남아 있는 날짜 수' },
      { id: 'memo', label: '메모 합계', value: '12개', caption: '기록된 감정 메모 수' },
    ],
  },
};

/* =========================
   FALLBACK_DAY_DATA
   - 날짜별 데이터를 찾지 못했을 때 쓰는 기본 하루치 데이터
   - byDate['04-21']의 첫 번째 대화방을 기본값으로 사용
========================= */
export const FALLBACK_DAY_DATA =
  FALLBACK_CHAT_HISTORY_DATA.byDate['04-21'];
