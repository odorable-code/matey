/**
 * [파일 역할]
 * - 감정 리포트 화면에서 쓰는 상태와 데이터 정리를 담당하는 커스텀 훅
 * - 탭, 기간, 캐릭터, 날짜 선택 상태를 한 곳에서 관리
 *
 * [여기서 찾을 것]
 * - 현재 더미 데이터: FALLBACK_REPORT_DATA
 * - 탭 기본값: DEFAULT_TAB_OPTIONS
 * - 기간 기본값: DEFAULT_PERIOD_OPTIONS
 * - 기본 캐릭터 데이터: FALLBACK_HERO_BOTS
 * - 실제 선택 상태: activeTab / selectedPeriod / selectedBotKey / selectedDate
 *
 * [수정 포인트]
 * - API 연결 시작: useEmotionReport 함수 안 rawReportData 부분
 * - 기본 탭 문구 수정: DEFAULT_TAB_OPTIONS
 * - 기간 문구 수정: DEFAULT_PERIOD_OPTIONS
 * - 캐릭터 수정: FALLBACK_HERO_BOTS
 * - 더미 리포트 내용 수정: FALLBACK_REPORT_DATA
 *
 * [주의]
 * - 이 파일은 데이터가 많아서 길지만,
 *   아래 큰 주석 단위로 끊어서 보면 훨씬 보기 쉬움
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

/* =========================
   날짜 기본 연도
   - "04-21" 같은 값이 들어오면 2026년 기준으로 해석
========================= */
const CURRENT_YEAR = 2026;

/* =========================
   기본 탭 목록
========================= */
const DEFAULT_TAB_OPTIONS = [
  { key: 'emotion', label: '감정 리포트' },
  { key: 'history', label: '대화 히스토리' },
];

/* =========================
   기본 기간 목록
========================= */
const DEFAULT_PERIOD_OPTIONS = [
  { key: '7d', label: '최근 7일' },
  { key: '30d', label: '최근 30일' },
  { key: '90d', label: '최근 90일' },
];

/* =========================
   캐릭터 이미지 경로
   - 이미지 파일 바꾸려면 여기 수정
========================= */
const CHARACTER_IMAGE_MAP = {
  cat: '/images/emotion-report/cat.png',
  bear: '/images/emotion-report/bear.png',
  dog: '/images/emotion-report/dog.png',
  hamster: '/images/emotion-report/hamster.png',
};

/* =========================
   감정 리포트 대표 캐릭터 기본 데이터
   - 캐릭터 이름/색상/설명/칩 텍스트 수정 가능
========================= */
const FALLBACK_HERO_BOTS = [
  {
    key: 'cat',
    name: '냥이',
    typeLabel: '직설형 리포터',
    fallbackLabel: '냥',
    accentColor: '#9A85FF',
    softColor: '#F2ECFF',
    imageUrl: CHARACTER_IMAGE_MAP.cat,
    imagePath: CHARACTER_IMAGE_MAP.cat,
    cardObjectPosition: 'center 14%',
    reportObjectPosition: 'center bottom',
    title: '냥이 피드백',
    summary: '감정을 크게 보기보다 어디서 흔들렸는지 먼저 짚어야 해.',
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
    imagePath: CHARACTER_IMAGE_MAP.bear,
    cardObjectPosition: 'center 18%',
    reportObjectPosition: 'center bottom',
    title: '곰이 리포트',
    summary: '지친 날에는 더 잘하려 하기보다 먼저 버티는 마음을 안아줘야 해.',
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
    imagePath: CHARACTER_IMAGE_MAP.dog,
    cardObjectPosition: 'center 16%',
    reportObjectPosition: 'center bottom',
    title: '강아지 리포트',
    summary: '큰 결론보다 작은 실행 하나를 같이 잡아주는 게 중요해 보여.',
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
    imagePath: CHARACTER_IMAGE_MAP.hamster,
    cardObjectPosition: 'center 12%',
    reportObjectPosition: 'center bottom',
    title: '햄이 리포트',
    summary: '감정이 생활 리듬과 같이 흔들리는 패턴이 보여.',
    bullets: [
      '수면이나 루틴이 흔들리면 감정 반응도 커져.',
      '작은 루틴 하나만 안정돼도 흐름이 정돈될 수 있어.',
      '거창한 다짐보다 생활 단위 회복이 중요해.',
    ],
    chips: ['루틴', '생활 정리', '잔잔한 회복'],
  },
];

/* =========================
   전체 더미 데이터
   - 아직 API 연결 전일 때 화면에 보여줄 데이터
   - 감정 리포트 / 히스토리 / 요약 카드까지 포함
   *
   * [나중에 수정할 때]
   * - 문구/숫자/카드 내용 바꾸려면 여기 수정
========================= */
const FALLBACK_REPORT_DATA = {
  tabOptions: DEFAULT_TAB_OPTIONS,
  periodOptions: DEFAULT_PERIOD_OPTIONS,
  heroBots: FALLBACK_HERO_BOTS,
  emotionTab: {
    heroBots: FALLBACK_HERO_BOTS,
    selectedHero: FALLBACK_HERO_BOTS[0],
    statCards: [
      { id: 'conversation-count', label: '대화량', value: '12회', caption: '선택 기간 동안 기록된 대화 횟수' }
      // { id: 'stability', label: '안정도', value: '77%', caption: '감정이 급격히 무너지지 않은 흐름' },
      // { id: 'recovery', label: '회복도', value: '74%', caption: '감정이 다시 정리되는 힘' },
      // { id: 'acceptance', label: '자기수용', value: '73%', caption: '자책보다 수용으로 이동한 흐름' },
    ],
    coreEmotion: {
      title: '복잡한 감정이 생활 리듬과 연결되어 나타나는 패턴이 보여요.',
      description:
        '하루 루틴이 흔들릴 때 감정 반응도 함께 커지는 흐름이 보여서, 마음과 생활 리듬을 같이 정리할 필요가 있어 보여요.',
      tags: ['루틴', '불안', '회복', '집중'],
    },
    emotionDistribution: {
      total: 12,
      items: [
        { label: '불안', value: 28, color: '#9A85FF', description: '압박과 걱정이 높았던 구간' },
        { label: '회복', value: 26, color: '#F2C94C', description: '다시 정리되는 흐름' },
        { label: '안정', value: 24, color: '#7ED4C7', description: '감정이 가라앉은 장면' },
        { label: '계획', value: 22, color: '#FFB38A', description: '정리와 실행으로 이어진 흐름' },
      ],
    },
    topicTags: ['시험', '비교', '불안', '미래', '회복', '루틴', '위로'],
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
  },
  chatHistoryTab: {
    heroBots: FALLBACK_HERO_BOTS,
    dateOptions: [
      { key: '04-21', label: '4월 21일' },
      { key: '04-22', label: '4월 22일' },
      { key: '04-23', label: '4월 23일' },
      { key: '04-24', label: '4월 24일' },
      { key: '04-25', label: '4월 25일' },
    ],
    byDate: {
      '04-21': {
        selectedBotKey: 'cat',
        summary: {
          title: '메모와 대화 흐름이 같이 남아 있는 하루예요.',
          description: '먼저 감정을 정리하고 작은 계획으로 넘어가려는 흐름이 보여요.',
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
          { id: 2, time: '09:13', speaker: 'bot', emotion: '공감', message: '결과 자체보다 “내가 뒤처진 것 같다”는 느낌이 더 크게 남은 것 같아.' },
          { id: 3, time: '09:16', speaker: 'me', emotion: '비교', message: '주변 친구들하고 비교하게 돼서 더 마음이 무거워.' },
          { id: 4, time: '09:18', speaker: 'bot', emotion: '정리', message: '비교가 시작되면 감정보다 자책이 먼저 커지는 흐름이 보여.' },
        ],
        noteCards: [
          { id: 'memo-1', title: '메모 01', description: '결과보다 비교 때문에 감정이 더 흔들렸다고 느낀 날.' },
          { id: 'memo-2', title: '메모 02', description: '해결책보다 이해받고 싶다는 욕구가 더 크게 올라온 흐름.' },
          { id: 'memo-3', title: '메모 03', description: '밤이 될수록 피로와 자책이 함께 올라오는 패턴.' },
        ],
        insight: {
          headline: '이 날의 대화는 “비교 → 자책 → 위로 필요” 흐름으로 이어졌어요.',
          description: '감정을 없애려 하기보다 비교가 시작되는 지점을 먼저 알아차리는 게 중요해 보여요.',
          meta: [
            { label: '반복 패턴', value: '비교 후 자책' },
            { label: '회복 포인트', value: '작은 기준 재설정' },
            { label: '추천 포커스', value: '밤 루틴 가볍게 정리' },
          ],
          tags: ['비교', '자책', '위로', '회복'],
        },
        botInterpretation: {
          title: '봇 해석 메모',
          summary: '감정이 커진 원인은 결과 자체보다 스스로를 평가하는 기준이 높아진 데 있어 보여요.',
          bullets: [
            '비교가 시작되면 감정이 빠르게 무거워지는 패턴이 반복돼요.',
            '하루 후반으로 갈수록 피로와 감정 반응이 같이 올라와요.',
            '해결보다 안정이 먼저 필요한 날로 해석할 수 있어요.',
          ],
        },
      },
      '04-22': {
        selectedBotKey: 'bear',
        summary: {
          title: '지친 마음을 먼저 다독이려는 흐름이 보여요.',
          description: '해결책보다 위로와 안정이 먼저 필요했던 날로 보여요.',
          chips: ['위로', '안정', '회복 필요'],
        },
        overviewCards: [
          { id: 'conversation-count', label: '대화 조각', value: '6개', caption: '선택한 날짜에 남은 주요 대화 기록' },
          { id: 'memo-count', label: '메모 수', value: '2개', caption: '감정 메모와 핵심 포인트' },
          { id: 'dominant-emotion', label: '주 감정', value: '지침', caption: '가장 강하게 반복된 감정 톤' },
          { id: 'focus-topic', label: '집중 주제', value: '휴식', caption: '대화에서 많이 다뤄진 주제' },
        ],
        chatEntries: [
          { id: 1, time: '20:11', speaker: 'me', emotion: '지침', message: '오늘은 아무것도 하기 싫고 그냥 쉬고 싶어.' },
          { id: 2, time: '20:13', speaker: 'bot', emotion: '위로', message: '지금은 의욕보다 회복이 먼저 필요한 신호처럼 들려.' },
          { id: 3, time: '20:17', speaker: 'me', emotion: '무기력', message: '쉬어도 괜찮은데, 쉬면 또 불안해질까 봐 걱정돼.' },
          { id: 4, time: '20:19', speaker: 'bot', emotion: '안정', message: '오늘 쉬는 건 미루는 게 아니라 다시 버틸 힘을 만드는 시간이야.' },
        ],
        noteCards: [
          { id: 'memo-1', title: '메모 01', description: '해야 할 일보다 먼저 몸과 마음이 지쳐 있던 날.' },
          { id: 'memo-2', title: '메모 02', description: '쉬고 싶지만 쉬는 것 자체에 불안을 느끼는 흐름.' },
        ],
        insight: {
          headline: '이 날의 대화는 “지침 → 쉬고 싶음 → 쉬는 것에 대한 불안”으로 이어졌어요.',
          description: '쉼이 필요하다는 신호를 받아들이는 연습이 중요해 보여요.',
          meta: [
            { label: '반복 패턴', value: '지침 후 불안' },
            { label: '회복 포인트', value: '쉼 허용하기' },
            { label: '추천 포커스', value: '과한 자책 줄이기' },
          ],
          tags: ['지침', '쉼', '불안', '회복'],
        },
        botInterpretation: {
          title: '봇 해석 메모',
          summary: '오늘은 성과보다 회복이 우선인 날이에요.',
          bullets: [
            '휴식에 대한 죄책감이 감정을 더 무겁게 만들 수 있어요.',
            '오늘의 핵심은 생산성이 아니라 안정이에요.',
            '하루를 가볍게 마무리하는 루틴이 도움이 될 수 있어요.',
          ],
        },
      },
      '04-23': {
        selectedBotKey: 'dog',
        summary: {
          title: '감정이 무거워도 다시 움직이려는 마음이 남아 있는 날이에요.',
          description: '불안과 걱정은 있었지만 다시 해보려는 의지가 드러났어요.',
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
          { id: 2, time: '08:35', speaker: 'bot', emotion: '응원', message: '오늘은 다 해내는 것보다 다시 시작했다는 사실이 더 중요해.' },
          { id: 3, time: '08:40', speaker: 'me', emotion: '의지', message: '그럼 진짜 작은 것 하나만 해볼까 싶어.' },
          { id: 4, time: '08:41', speaker: 'bot', emotion: '격려', message: '좋아. 작게 시작하면 부담이 줄고 움직일 힘도 다시 생길 거야.' },
        ],
        noteCards: [
          { id: 'memo-1', title: '메모 01', description: '불안은 있었지만 멈추지 않으려는 흐름이 보인 날.' },
          { id: 'memo-2', title: '메모 02', description: '큰 계획보다 작은 시작이 더 중요했던 날.' },
          { id: 'memo-3', title: '메모 03', description: '응원이 있을 때 행동으로 이어질 가능성이 커졌음.' },
        ],
        insight: {
          headline: '이 날의 대화는 “걱정 → 다시 시도 → 작은 실행” 흐름으로 이어졌어요.',
          description: '성공보다 재시작 자체에 의미를 두는 태도가 도움이 되는 날이었어요.',
          meta: [
            { label: '반복 패턴', value: '걱정 후 시도' },
            { label: '회복 포인트', value: '작게 시작하기' },
            { label: '추천 포커스', value: '첫 행동 낮추기' },
          ],
          tags: ['걱정', '시도', '응원', '시작'],
        },
        botInterpretation: {
          title: '봇 해석 메모',
          summary: '완벽하게 하려는 부담보다 다시 움직이려는 힘이 더 중요하게 보였어요.',
          bullets: [
            '작게 시작했을 때 감정 부담이 줄어드는 패턴이 보여요.',
            '응원과 지지가 행동으로 이어지는 연결이 있어요.',
            '오늘은 결과보다 재시작 자체를 인정해주는 게 중요해요.',
          ],
        },
      },
      '04-24': {
        selectedBotKey: 'hamster',
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
          { id: 2, time: '10:05', speaker: 'bot', emotion: '정리', message: '오늘 감정은 마음 문제이기도 하지만 생활 리듬 영향도 커 보여.' },
        ],
        noteCards: [
          { id: 'memo-1', title: '메모 01', description: '수면 부족이 감정 예민함으로 연결된 날.' },
          { id: 'memo-2', title: '메모 02', description: '큰 해결보다 루틴 회복이 우선인 흐름.' },
        ],
        insight: {
          headline: '이 날의 대화는 “수면 흔들림 → 예민함 증가” 흐름으로 이어졌어요.',
          description: '감정 해석과 함께 생활 리듬 점검이 같이 필요한 날이었어요.',
          meta: [
            { label: '반복 패턴', value: '수면 후 예민함' },
            { label: '회복 포인트', value: '루틴 복구' },
            { label: '추천 포커스', value: '취침 전 정리' },
          ],
          tags: ['수면', '루틴', '예민함', '정리'],
        },
        botInterpretation: {
          title: '봇 해석 메모',
          summary: '오늘의 감정은 생활 리듬과 더 밀접하게 연결돼 있어 보여요.',
          bullets: [
            '생활 패턴이 흔들릴수록 감정 반응도 커져요.',
            '작은 루틴 회복이 전체 안정에 도움이 돼요.',
            '자기비난보다 생활 리듬 점검이 먼저예요.',
          ],
        },
      },
      '04-25': {
        selectedBotKey: 'cat',
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
          headline: '이 날의 대화는 “막연한 불안 → 기준 점검 → 감정 정리”로 이어졌어요.',
          description: '감정을 억누르기보다 기준을 조절하면서 현실적인 안정감을 만든 날이에요.',
          meta: [
            { label: '반복 패턴', value: '불안 후 기준 점검' },
            { label: '회복 포인트', value: '현실적인 기대치' },
            { label: '추천 포커스', value: '하루 마감 정리' },
          ],
          tags: ['정리', '불안 완화', '기준', '현실 점검'],
        },
        botInterpretation: {
          title: '봇 해석 메모',
          summary: '오늘은 감정에 끌려가기보다 스스로 기준을 조절하면서 안정을 찾으려는 흐름이 보였어요.',
          bullets: [
            '현실적인 기준 조절이 감정 부담을 줄였어요.',
            '막연한 불안이 정리 가능한 걱정으로 바뀌는 흐름이 있었어요.',
            '작은 정리가 큰 안정보다 먼저 도움이 되는 날이었어요.',
          ],
        },
      },
    },
  },
  historyOverview: {
    overviewCards: [
      { id: 'days', label: '기록 날짜', value: '5일', caption: '대화 히스토리가 남아 있는 날짜 수' },
      { id: 'memo', label: '메모 합계', value: '12개', caption: '기록된 감정 메모 수' },
    ],
  },
};

/* =========================
   아래부터는 데이터 모양을 맞춰주는 보조 함수들
   - 키 추출
   - 라벨 추출
   - 날짜 문자열 파싱
   - 날짜 옵션 정리
========================= */
const getOptionKey = (item) =>
  item?.key ?? item?.value ?? item?.id ?? item?.tabKey ?? item?.periodKey ?? '';

const getOptionLabel = (item) =>
  item?.label ?? item?.name ?? item?.title ?? item?.text ?? '';

const parseFlexibleDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();

  let match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match.map(Number);
    return new Date(year, month - 1, day);
  }

  match = trimmed.match(/^(\d{2})-(\d{2})$/);
  if (match) {
    const [, month, day] = match.map(Number);
    return new Date(CURRENT_YEAR, month - 1, day);
  }

  match = trimmed.match(/^(\d{1,2})월\s*(\d{1,2})일$/);
  if (match) {
    const [, month, day] = match.map(Number);
    return new Date(CURRENT_YEAR, month - 1, day);
  }

  return null;
};

const formatFullDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

const formatShortKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const normalizeDateOptions = (chatHistoryData = {}) => {
  const raw =
    chatHistoryData?.dateOptions ||
    chatHistoryData?.dates ||
    chatHistoryData?.historyDates ||
    [];

  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item) => {
        const key = getOptionKey(item);
        const label = getOptionLabel(item) || key;
        const date = parseFlexibleDate(key) || parseFlexibleDate(label) || null;

        return {
          key,
          label,
          date,
          fullKey: date ? formatFullDateKey(date) : '',
          shortKey: date ? formatShortKey(date) : '',
        };
      })
      .filter((item) => item.key);
  }

  // 서버 데이터가 없으면 날짜 더미를 만들지 않고 빈 배열로 둔다.
  return [];
};

const mergeUniqueByKey = (items = []) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = getOptionKey(item);
    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const isSameDateValue = (option, value) =>
  !!option &&
  !!value &&
  (option.key === value || option.fullKey === value || option.shortKey === value);

/* =========================
   메인 훅 시작
   - 실제 화면에서 import해서 쓰는 부분
========================= */
function useEmotionReport() {
  /* =========================
     실제 API 연결 위치
     - 나중에 서버 데이터 붙일 때 여기 교체
     - 예: const rawReportData = apiData ?? FALLBACK_REPORT_DATA;
  ========================= */
  // 서버 API 연결 전에는 더미 데이터를 보여주지 않고, 빈 상태로 둔다.
  const rawReportData = null;

  /* =========================
     전체 데이터 안전하게 정리
  ========================= */
  const reportData = useMemo(
    () => (rawReportData && Object.keys(rawReportData).length > 0 ? rawReportData : {}),
    [rawReportData]
  );

  /* =========================
     감정 리포트 탭 데이터 정리
  ========================= */
  const emotionTabData = useMemo(() => {
    if (reportData?.emotionTab && Object.keys(reportData.emotionTab).length > 0) {
      return reportData.emotionTab;
    }

    if (reportData?.emotionReport && Object.keys(reportData.emotionReport).length > 0) {
      return reportData.emotionReport;
    }

    return {};
  }, [reportData]);

  /* =========================
     대화 히스토리 탭 데이터 정리
  ========================= */
  const chatHistoryTabData = useMemo(() => {
    if (reportData?.chatHistoryTab && Object.keys(reportData.chatHistoryTab).length > 0) {
      return reportData.chatHistoryTab;
    }

    if (reportData?.chatHistory && Object.keys(reportData.chatHistory).length > 0) {
      return reportData.chatHistory;
    }

    return {};
  }, [reportData]);

  /* =========================
     히스토리 개요 데이터 정리
  ========================= */
  const historyOverview = useMemo(() => {
    if (reportData?.historyOverview && Object.keys(reportData.historyOverview).length > 0) {
      return reportData.historyOverview;
    }

    return {};
  }, [reportData]);

  /* =========================
     탭 / 기간 / 봇 / 날짜 옵션 정리
  ========================= */
  const tabOptions = useMemo(
    () =>
      Array.isArray(reportData?.tabOptions) && reportData.tabOptions.length > 0
        ? reportData.tabOptions
        : DEFAULT_TAB_OPTIONS,
    [reportData]
  );

  const periodOptions = useMemo(
    () =>
      Array.isArray(reportData?.periodOptions) && reportData.periodOptions.length > 0
        ? reportData.periodOptions
        : DEFAULT_PERIOD_OPTIONS,
    [reportData]
  );

  const botOptions = useMemo(
    () =>
      mergeUniqueByKey([
        ...(Array.isArray(reportData?.botOptions) ? reportData.botOptions : []),
        ...(Array.isArray(reportData?.heroBots) ? reportData.heroBots : []),
        ...(Array.isArray(emotionTabData?.heroBots) ? emotionTabData.heroBots : []),
        ...(Array.isArray(chatHistoryTabData?.heroBots) ? chatHistoryTabData.heroBots : []),
      ]),
    [reportData, emotionTabData, chatHistoryTabData]
  );

  const chatDateOptions = useMemo(
    () => normalizeDateOptions(chatHistoryTabData),
    [chatHistoryTabData]
  );

  /* =========================
     기본 선택값
  ========================= */
  const defaultActiveTab = getOptionKey(tabOptions[0]) || 'emotion';
  const defaultPeriod = getOptionKey(periodOptions[1]) || getOptionKey(periodOptions[0]) || '30d';
  const defaultBotKey = getOptionKey(botOptions[0]) || '';
  const defaultDate = chatDateOptions[0]?.key || '';

  /* =========================
     실제 선택 상태
     - 탭
     - 기간
     - 캐릭터
     - 날짜
  ========================= */
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [selectedBotKey, setSelectedBotKey] = useState(defaultBotKey);
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  /* =========================
     데이터가 바뀌었을 때 선택값 유효성 다시 확인
     - 없는 값이면 기본값으로 되돌림
  ========================= */
  useEffect(() => {
    const valid = tabOptions.some((item) => getOptionKey(item) === activeTab);
    if (!valid) setActiveTab(defaultActiveTab);
  }, [tabOptions, activeTab, defaultActiveTab]);

  useEffect(() => {
    const valid = periodOptions.some((item) => getOptionKey(item) === selectedPeriod);
    if (!valid) setSelectedPeriod(defaultPeriod);
  }, [periodOptions, selectedPeriod, defaultPeriod]);

  useEffect(() => {
    if (!botOptions.length) {
      if (selectedBotKey !== '') setSelectedBotKey('');
      return;
    }

    const valid = botOptions.some((item) => getOptionKey(item) === selectedBotKey);
    if (!valid) setSelectedBotKey(defaultBotKey);
  }, [botOptions, selectedBotKey, defaultBotKey]);

  useEffect(() => {
    if (!chatDateOptions.length) {
      if (selectedDate !== '') setSelectedDate('');
      return;
    }

    const valid = chatDateOptions.some((item) => isSameDateValue(item, selectedDate));
    if (!valid) setSelectedDate(defaultDate);
  }, [chatDateOptions, selectedDate, defaultDate]);

  /* =========================
     선택값 변경 함수
     - 컴포넌트에서 onClick / onChange로 연결해서 사용
  ========================= */
  const handleTabChange = useCallback((nextKey) => {
    setActiveTab(nextKey);
  }, []);

  const handlePeriodChange = useCallback((nextKey) => {
    setSelectedPeriod(nextKey);
  }, []);

  const handleBotChange = useCallback((nextKey) => {
    setSelectedBotKey(nextKey);
  }, []);

  const handleDateChange = useCallback((nextKey) => {
    setSelectedDate(nextKey);
  }, []);

  /* =========================
     바깥으로 내보내는 값들
  ========================= */
  return {
    activeTab,
    selectedPeriod,
    selectedBotKey,
    selectedDate,
    tabOptions,
    periodOptions,
    botOptions,
    reportData,
    emotionTabData,
    chatHistoryTabData,
    historyOverview,
    handleTabChange,
    handlePeriodChange,
    handleBotChange,
    handleDateChange,
    setActiveTab,
    setSelectedPeriod,
    setSelectedBotKey,
    setSelectedDate,
  };
}

export default useEmotionReport;
