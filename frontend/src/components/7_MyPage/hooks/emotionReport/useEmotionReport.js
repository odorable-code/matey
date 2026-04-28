import { useEffect, useMemo, useState } from 'react';

/**
 * 이미지 교체 방법
 * 1) 지금은 imageUrl / imagePath를 비워 둠
 * 2) 나중에 사용자가 직접 업로드한 경로로 아래 값만 바꾸면 됨
 *    예: imageUrl: '/images/emotion-report/cat.png'
 */

export const REPORT_TAB_OPTIONS = [
  { key: 'emotion', label: '감정 리포트' },
  { key: 'history', label: '대화 히스토리' },
];

export const REPORT_PERIOD_OPTIONS = [
  { key: '7d', label: '최근 7일' },
  { key: '30d', label: '최근 30일' },
  { key: '90d', label: '최근 90일' },
];

export const BOT_OPTIONS = [
  {
    key: 'cat',
    name: '냥이',
    typeLabel: '직설형 리포터',
    fallbackLabel: '냥',
    accentColor: '#9A85FF',
    softColor: '#F2ECFF',
    imageUrl: '',
    imagePath: '',
  },
  {
    key: 'bear',
    name: '곰이',
    typeLabel: '든든한 위로형',
    fallbackLabel: '곰',
    accentColor: '#F3A55C',
    softColor: '#FFF1E4',
    imageUrl: '',
    imagePath: '',
  },
  {
    key: 'dog',
    name: '강아지',
    typeLabel: '공감·응원형',
    fallbackLabel: '강',
    accentColor: '#7DBBF7',
    softColor: '#ECF6FF',
    imageUrl: '',
    imagePath: '',
  },
  {
    key: 'hamster',
    name: '햄이',
    typeLabel: '세심한 생활형',
    fallbackLabel: '햄',
    accentColor: '#C6A5FF',
    softColor: '#F4EEFF',
    imageUrl: '',
    imagePath: '',
  },
];

const HERO_REPORT_MAP = {
  cat: {
    title: '냥이 피드백',
    summary:
      '감정을 너무 크게 보기보다, 정확히 어디서 흔들렸는지부터 짚어야 해. 지금 필요한 건 예민함이 아니라 해석이야.',
    bullets: [
      '결과 불안이 감정보다 먼저 몸집을 키우는 흐름이 보여.',
      '비교가 시작되면 바로 자책으로 이어지는 연결이 자주 보여.',
      '기준을 조금만 조절해도 전체 감정 흐름이 훨씬 가벼워질 수 있어.',
    ],
    chips: ['현실 점검', '자책 교정', '기준 재정비'],
  },
  bear: {
    title: '곰이 리포트',
    summary:
      '지친 날이 있어도 결국 다시 돌아오려는 힘이 보여. 지금은 더 잘하려 하기보다, 버티고 있는 마음을 먼저 안아줘야 해.',
    bullets: [
      '감정이 무거운 날에도 완전히 놓지 않고 다시 돌아오려는 힘이 있어.',
      '해결보다 안정이 먼저 필요한 날이 자주 보여.',
      '자기비판을 줄이면 회복 속도도 더 부드럽게 올라갈 가능성이 커.',
    ],
    chips: ['안정감', '버팀', '따뜻한 위로'],
  },
  dog: {
    title: '강아지 리포트',
    summary:
      '많이 힘든데도 계속 해보려는 마음이 남아 있어. 그래서 지금은 큰 결론보다 작은 실행 하나를 같이 잡아주는 게 중요해 보여.',
    bullets: [
      '불안이 올라와도 도움을 찾고 다시 움직이려는 흐름이 분명히 있어.',
      '혼자 다 해결하려 할수록 감정 부담이 더 커지는 장면이 보여.',
      '작은 계획으로 쪼개면 훨씬 덜 무겁게 시작할 수 있어.',
    ],
    chips: ['공감', '응원', '작은 실행'],
  },
  hamster: {
    title: '햄이 리포트',
    summary:
      '감정이 생활 리듬하고 같이 흔들리는 패턴이 보여. 마음을 한 번에 바꾸기보다 하루 루틴 하나를 잡는 게 더 효과적일 수 있어.',
    bullets: [
      '수면이나 일상 리듬이 흐트러진 날 감정 반응도 더 커지는 편이야.',
      '작은 루틴 하나만 안정돼도 전체 감정 흐름이 정돈될 수 있어.',
      '거창한 다짐보다 생활 단위의 작은 회복이 더 중요해 보여.',
    ],
    chips: ['루틴', '생활 정리', '잔잔한 회복'],
  },
};

const BOT_ANALYSIS_MAP = {
  cat: {
    stability: 82,
    recovery: 76,
    acceptance: 68,
    coreTitle: '불안과 자책이 반복되지만, 감정의 원인을 정확히 짚으려는 흐름도 보여요.',
    coreDescription:
      '결과 중심의 압박 때문에 스스로를 몰아붙이는 순간이 있었지만, 문제를 감정이 아닌 상황 구조로 보려는 시도도 함께 나타났어요.',
    flow: [
      { label: '불안', value: 72 },
      { label: '자책', value: 56 },
      { label: '정리', value: 49 },
      { label: '위로', value: 42 },
      { label: '집중', value: 36 },
    ],
    distribution: [
      { label: '불안', value: 34, color: '#9A85FF', description: '압박과 걱정이 높았던 구간' },
      { label: '안정', value: 24, color: '#7ED4C7', description: '스스로 정리된 흐름' },
      { label: '자책', value: 22, color: '#FF8DB3', description: '스스로를 몰아붙인 표현' },
      { label: '위로', value: 20, color: '#FFB38A', description: '회복을 찾는 감정 반응' },
    ],
    defaultTopics: ['시험', '비교', '자기기대', '불안', '자책'],
  },
  bear: {
    stability: 86,
    recovery: 81,
    acceptance: 78,
    coreTitle: '지친 마음이 자주 보였지만, 다시 버티고 일어나는 힘도 분명히 있어요.',
    coreDescription:
      '부담감이 반복되는 날에도 완전히 무너지기보다 다시 일상으로 돌아오려는 회복 흐름이 꾸준히 나타났어요.',
    flow: [
      { label: '위로', value: 68 },
      { label: '안정', value: 61 },
      { label: '불안', value: 48 },
      { label: '회복', value: 46 },
      { label: '자책', value: 33 },
    ],
    distribution: [
      { label: '안정', value: 31, color: '#7ED4C7', description: '감정이 정리된 구간' },
      { label: '위로', value: 29, color: '#F3A55C', description: '따뜻한 회복 흐름' },
      { label: '불안', value: 23, color: '#9A85FF', description: '걱정이 올라온 장면' },
      { label: '자책', value: 17, color: '#FF8DB3', description: '스스로에게 엄격했던 구간' },
    ],
    defaultTopics: ['위로', '버팀', '회복', '일상', '마음정리'],
  },
  dog: {
    stability: 79,
    recovery: 83,
    acceptance: 71,
    coreTitle: '마음이 흔들릴 때마다 도움을 찾고 다시 해보려는 의지가 분명히 보여요.',
    coreDescription:
      '힘들다고 느끼는 순간이 있어도 그대로 멈추기보다 해결 방법을 함께 찾으려는 흐름이 자주 등장했어요.',
    flow: [
      { label: '공감', value: 70 },
      { label: '불안', value: 55 },
      { label: '실행', value: 51 },
      { label: '안정', value: 47 },
      { label: '위로', value: 40 },
    ],
    distribution: [
      { label: '공감', value: 30, color: '#FF8DB3', description: '감정을 이해받고 싶은 흐름' },
      { label: '불안', value: 27, color: '#9A85FF', description: '걱정과 긴장이 올라온 구간' },
      { label: '안정', value: 23, color: '#7ED4C7', description: '다시 가라앉은 장면' },
      { label: '실행', value: 20, color: '#FFB38A', description: '해결책을 찾는 흐름' },
    ],
    defaultTopics: ['응원', '실행', '공감', '불안', '계획'],
  },
  hamster: {
    stability: 77,
    recovery: 74,
    acceptance: 73,
    coreTitle: '복잡한 감정이 생활 리듬과 연결되어 나타나는 패턴이 보여요.',
    coreDescription:
      '마음이 흔들릴 때 수면, 식사, 공부 루틴도 같이 영향을 받는 흐름이 보여서 작은 생활 단위 정리가 중요해 보여요.',
    flow: [
      { label: '루틴', value: 63 },
      { label: '불안', value: 52 },
      { label: '안정', value: 48 },
      { label: '회복', value: 41 },
      { label: '집중', value: 35 },
    ],
    distribution: [
      { label: '루틴', value: 28, color: '#F2C94C', description: '생활 리듬과 연결된 흐름' },
      { label: '불안', value: 26, color: '#9A85FF', description: '걱정이 올라온 구간' },
      { label: '안정', value: 24, color: '#7ED4C7', description: '정돈된 장면' },
      { label: '회복', value: 22, color: '#FFB38A', description: '잔잔히 나아진 흐름' },
    ],
    defaultTopics: ['루틴', '생활관리', '회복', '불안', '집중'],
  },
};

const BOT_HISTORY_REPORTS = {
  cat: {
    toneLabel: '직설형 리포트',
    summary:
      '지금 가장 눈에 띄는 건 결과 압박 때문에 스스로를 몰아붙이는 흐름이 반복된다는 점이에요.',
    feedbackTitle: '자책보다 먼저 원인을 분리해서 봐야 해요.',
    feedbackBody:
      '불안의 원인을 감정 탓으로 돌리기보다, 실제로 무엇이 부담이었는지부터 분리해서 보면 감정이 훨씬 덜 무거워질 수 있어요.',
    actionTips: [
      '오늘 가장 흔들린 순간을 하나만 고르기',
      '그 순간의 원인을 감정/상황으로 나눠 적기',
      '결과 기준 대신 과정 기준 문장 하나 만들기',
    ],
    meters: [
      { label: '현실 점검', value: 84 },
      { label: '자책 경향', value: 62 },
      { label: '회복 가능성', value: 74 },
    ],
  },
  bear: {
    toneLabel: '든든한 위로형',
    summary:
      '감정이 힘들게 올라오는 날에도 완전히 무너지기보다 다시 버티려는 힘이 계속 남아 있어요.',
    feedbackTitle: '지금은 잘하려는 마음보다 버틴 마음을 먼저 봐야 해요.',
    feedbackBody:
      '감정이 흔들린 날에도 결국 다시 일상으로 돌아가려는 흐름이 있으니, 지금은 자기비판보다 자기인정이 더 필요한 시기예요.',
    actionTips: [
      '오늘 버텨낸 것 1가지 적기',
      '나를 너무 몰아붙인 문장 지우기',
      '휴식 시간도 계획에 포함시키기',
    ],
    meters: [
      { label: '안정감', value: 88 },
      { label: '회복력', value: 81 },
      { label: '자기수용', value: 78 },
    ],
  },
  dog: {
    toneLabel: '공감·응원형',
    summary:
      '힘들다는 표현 뒤에 “그래도 해보겠다”는 의지가 같이 붙는 날이 많았어요.',
    feedbackTitle: '지금은 큰 결론보다 작은 실행 하나면 충분해요.',
    feedbackBody:
      '마음이 복잡할수록 해결을 크게 잡기 쉬운데, 지금은 오늘 할 수 있는 가장 작은 행동 한 가지로 시작하는 게 좋아요.',
    actionTips: [
      '오늘 할 일 1개만 정하기',
      '불안할 때 바로 할 호흡 루틴 만들기',
      '도움 요청 문장 미리 준비해두기',
    ],
    meters: [
      { label: '공감 민감도', value: 86 },
      { label: '실행 연결', value: 77 },
      { label: '감정 회복', value: 82 },
    ],
  },
  hamster: {
    toneLabel: '세심한 생활형',
    summary:
      '감정 흐름이 생활 리듬과 꽤 밀접하게 연결되어 있어서 작은 습관 정리가 중요해 보여요.',
    feedbackTitle: '생활 단위를 정리하면 감정도 같이 따라올 가능성이 커요.',
    feedbackBody:
      '지금은 마음을 한 번에 다 바꾸려 하기보다 수면, 식사, 공부 같은 작은 루틴 하나를 안정시키는 게 먼저예요.',
    actionTips: [
      '취침 시간 30분만 고정하기',
      '하루 첫 할 일 하나만 일정에 넣기',
      '감정이 흔들린 날의 생활 패턴 기록하기',
    ],
    meters: [
      { label: '루틴 민감도', value: 83 },
      { label: '생활 회복', value: 72 },
      { label: '집중 회복', value: 69 },
    ],
  },
};

const DAILY_REPORTS = {
  '2026-04-27': {
    dateKey: '2026-04-27',
    displayDate: '4월 27일',
    dominantEmotion: '불안',
    activeTimeRange: '22:00 ~ 23:30',
    conversationCount: 5,
    summaryTitle: '시험 결과와 비교에 대한 압박이 크게 올라온 날',
    mainConcern: '성적이 기대에 못 미칠까 봐 불안한 마음',
    dominantTopics: ['시험', '성적', '비교'],
    memo: [
      '오늘은 결과에 대한 압박이 특히 크게 느껴졌어요.',
      '친구와 비교하면서 스스로를 깎아내리는 말이 반복됐어요.',
      '그래도 마지막에는 다시 계획을 세워보려는 흐름이 남아 있었어요.',
    ],
    timeline: [
      {
        id: 1,
        title: '시험 결과 불안',
        description: '점수와 결과를 미리 걱정하는 표현이 반복됐어요.',
      },
      {
        id: 2,
        title: '비교 후 자책',
        description: '주변 사람과 비교한 뒤 스스로를 과하게 평가했어요.',
      },
      {
        id: 3,
        title: '다시 정리 시도',
        description: '마지막에는 일정을 다시 정리하며 회복 흐름이 보였어요.',
      },
    ],
    chatPreview: [
      {
        id: 'd1-u1',
        role: 'user',
        name: '사용자',
        time: '22:08',
        text: '나 이번 시험 망한 것 같아. 다들 잘하는 것 같은데 나만 뒤처지는 느낌이야.',
      },
      {
        id: 'd1-b1',
        role: 'bot',
        name: '냥이',
        time: '22:09',
        text: '지금은 결과를 확정한 것도 아닌데 벌써 스스로를 탈락 처리하고 있어. 그건 너무 빨라.',
      },
      {
        id: 'd1-u2',
        role: 'user',
        name: '사용자',
        time: '22:16',
        text: '그래도 진짜 자신이 없어. 계속 비교하게 돼.',
      },
      {
        id: 'd1-b2',
        role: 'bot',
        name: '강아지',
        time: '22:17',
        text: '많이 불안했겠다. 오늘은 비교를 멈추고 내일 할 한 가지만 같이 정해보자.',
      },
    ],
  },
  '2026-04-24': {
    dateKey: '2026-04-24',
    displayDate: '4월 24일',
    dominantEmotion: '위로',
    activeTimeRange: '21:00 ~ 22:10',
    conversationCount: 4,
    summaryTitle: '지친 마음을 털어놓으며 위로를 찾은 날',
    mainConcern: '계속 버티는 게 맞는지에 대한 회의감',
    dominantTopics: ['위로', '버팀', '진로'],
    memo: [
      '오늘은 “버티는 게 맞는지”에 대한 피로감이 자주 나왔어요.',
      '감정을 해결하려 하기보다 누군가 알아주길 바라는 흐름이 강했어요.',
      '위로를 받은 뒤에는 마음이 조금 가라앉는 반응이 있었어요.',
    ],
    timeline: [
      {
        id: 1,
        title: '지침 표현',
        description: '버겁고 지친 마음을 직접적으로 표현했어요.',
      },
      {
        id: 2,
        title: '공감 요청',
        description: '답을 찾기보다 위로와 인정이 더 필요한 상태였어요.',
      },
      {
        id: 3,
        title: '감정 완화',
        description: '대화 후 감정 온도가 조금 낮아졌어요.',
      },
    ],
    chatPreview: [
      {
        id: 'd2-u1',
        role: 'user',
        name: '사용자',
        time: '21:14',
        text: '요즘 그냥 계속 버티는 느낌이야. 이게 맞는 건지도 모르겠어.',
      },
      {
        id: 'd2-b1',
        role: 'bot',
        name: '곰이',
        time: '21:15',
        text: '그렇게 버티고 있다는 것만으로도 이미 많이 해내고 있는 거야. 오늘은 답보다 마음을 먼저 쉬게 하자.',
      },
    ],
  },
  '2026-04-21': {
    dateKey: '2026-04-21',
    displayDate: '4월 21일',
    dominantEmotion: '공감',
    activeTimeRange: '20:30 ~ 21:20',
    conversationCount: 3,
    summaryTitle: '해결보다 공감과 응원이 더 필요했던 날',
    mainConcern: '해야 할 일은 많은데 손이 잘 안 가는 상태',
    dominantTopics: ['미루기', '압박', '응원'],
    memo: [
      '해야 할 일이 많다는 부담이 있었지만 바로 실행으로 이어지지 않았어요.',
      '혼나기보다 같이 정리해주는 톤에 더 잘 반응했어요.',
      '작은 계획으로 쪼개면 시작할 수 있겠다는 말이 나왔어요.',
    ],
    timeline: [
      {
        id: 1,
        title: '할 일 압박',
        description: '해야 할 일이 너무 많아 시작 자체가 어려웠어요.',
      },
      {
        id: 2,
        title: '공감 반응',
        description: '공감 받았을 때 감정이 먼저 풀렸어요.',
      },
      {
        id: 3,
        title: '작은 실행 계획',
        description: '일정을 작게 나누며 다시 시도할 여지가 생겼어요.',
      },
    ],
    chatPreview: [
      {
        id: 'd3-u1',
        role: 'user',
        name: '사용자',
        time: '20:41',
        text: '할 건 많은데 시작이 너무 싫어. 괜히 더 미루게 돼.',
      },
      {
        id: 'd3-b1',
        role: 'bot',
        name: '강아지',
        time: '20:42',
        text: '그럴 수 있어. 오늘은 다 하려고 하지 말고 가장 작은 한 가지부터 같이 정해보자.',
      },
    ],
  },
  '2026-04-18': {
    dateKey: '2026-04-18',
    displayDate: '4월 18일',
    dominantEmotion: '루틴',
    activeTimeRange: '07:30 ~ 08:10',
    conversationCount: 2,
    summaryTitle: '생활 리듬이 무너지며 감정도 흔들린 날',
    mainConcern: '수면 부족으로 하루 시작부터 지쳐 있는 상태',
    dominantTopics: ['수면', '루틴', '피로'],
    memo: [
      '수면 부족이 감정 예민함으로 바로 이어졌어요.',
      '생활 루틴을 조금만 정리해도 감정 반응이 달라질 가능성이 보여요.',
    ],
    timeline: [
      {
        id: 1,
        title: '수면 부족',
        description: '피로감이 대화 전체 톤에 영향을 줬어요.',
      },
      {
        id: 2,
        title: '루틴 필요',
        description: '감정보다 생활 리듬 정리가 더 우선일 수 있어요.',
      },
    ],
    chatPreview: [
      {
        id: 'd4-u1',
        role: 'user',
        name: '사용자',
        time: '07:36',
        text: '잠을 제대로 못 자서 하루 시작부터 너무 예민해.',
      },
      {
        id: 'd4-b1',
        role: 'bot',
        name: '햄이',
        time: '07:37',
        text: '오늘은 감정을 다 고치려 하지 말고, 수면이 흔들린 날의 루틴부터 정리해보자.',
      },
    ],
  },
  '2026-04-10': {
    dateKey: '2026-04-10',
    displayDate: '4월 10일',
    dominantEmotion: '안정',
    activeTimeRange: '18:00 ~ 19:00',
    conversationCount: 3,
    summaryTitle: '감정이 비교적 안정적으로 정리된 날',
    mainConcern: '불안을 키우지 않고 하루를 마무리하고 싶은 마음',
    dominantTopics: ['안정', '회복', '일상'],
    memo: [
      '오늘은 감정이 크게 요동치기보다 차분하게 정리되는 흐름이 있었어요.',
      '스스로를 다그치기보다 하루를 정리하려는 말들이 더 많았어요.',
    ],
    timeline: [
      {
        id: 1,
        title: '감정 완화',
        description: '불안이 크게 커지지 않고 유지됐어요.',
      },
      {
        id: 2,
        title: '하루 정리',
        description: '계획과 감정을 함께 정리하려는 흐름이 보였어요.',
      },
    ],
    chatPreview: [
      {
        id: 'd5-u1',
        role: 'user',
        name: '사용자',
        time: '18:22',
        text: '오늘은 그래도 조금 덜 흔들린 것 같아.',
      },
      {
        id: 'd5-b1',
        role: 'bot',
        name: '곰이',
        time: '18:23',
        text: '그 흐름이 정말 중요해. 크게 나아지지 않아도 덜 흔들린 하루는 충분히 의미 있어.',
      },
    ],
  },
  '2026-03-29': {
    dateKey: '2026-03-29',
    displayDate: '3월 29일',
    dominantEmotion: '회복',
    activeTimeRange: '19:30 ~ 20:20',
    conversationCount: 3,
    summaryTitle: '조금씩 다시 해보려는 마음이 살아난 날',
    mainConcern: '쉬었다가 다시 시작하는 것에 대한 죄책감',
    dominantTopics: ['회복', '재시작', '죄책감'],
    memo: [
      '쉬고 난 뒤 다시 시작해도 괜찮은지 묻는 말이 있었어요.',
      '완벽하게 돌아오지 않아도 재시작 자체를 긍정하는 흐름이 나왔어요.',
    ],
    timeline: [
      {
        id: 1,
        title: '쉬는 것에 대한 죄책감',
        description: '휴식 후 다시 시작하는 걸 불안해했어요.',
      },
      {
        id: 2,
        title: '재시작 허용',
        description: '조금씩 돌아와도 된다는 감각이 생겼어요.',
      },
    ],
    chatPreview: [
      {
        id: 'd6-u1',
        role: 'user',
        name: '사용자',
        time: '19:44',
        text: '쉬고 나니까 더 죄책감이 들어. 다시 시작해도 되나 싶어.',
      },
      {
        id: 'd6-b1',
        role: 'bot',
        name: '강아지',
        time: '19:45',
        text: '그럼, 다시 시작하는 건 늦은 게 아니라 돌아오는 과정이야.',
      },
    ],
  },
};

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getReferenceDate(dailyReports) {
  const lastDateKey = Object.keys(dailyReports).sort().slice(-1)[0];
  return lastDateKey ? parseDateKey(lastDateKey) : new Date();
}

function getDiffDays(baseDate, targetDate) {
  const diff = baseDate.getTime() - targetDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getPeriodDays(periodKey) {
  if (periodKey === '90d') return 90;
  if (periodKey === '30d') return 30;
  return 7;
}

function filterDailyReportsByPeriod(dailyReports, selectedPeriod) {
  const maxDays = getPeriodDays(selectedPeriod);
  const referenceDate = getReferenceDate(dailyReports);

  return Object.entries(dailyReports)
    .filter(([dateKey]) => {
      const diffDays = getDiffDays(referenceDate, parseDateKey(dateKey));
      return diffDays >= 0 && diffDays < maxDays;
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [dateKey, value]) => {
      acc[dateKey] = value;
      return acc;
    }, {});
}

function getLastDateKey(dailyReports) {
  const keys = Object.keys(dailyReports).sort();
  return keys[keys.length - 1] || '';
}

function getTopTopics(filteredDailyReports, limit = 8) {
  const topicCounter = {};

  Object.values(filteredDailyReports).forEach((report) => {
    (report.dominantTopics || []).forEach((topic) => {
      topicCounter[topic] = (topicCounter[topic] || 0) + 1;
    });
  });

  return Object.entries(topicCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic]) => topic);
}

function getStrongestEmotion(filteredDailyReports) {
  const emotionCounter = {};

  Object.values(filteredDailyReports).forEach((report) => {
    const key = report.dominantEmotion || '감정';
    emotionCounter[key] = (emotionCounter[key] || 0) + 1;
  });

  const [topEmotion] =
    Object.entries(emotionCounter).sort((a, b) => b[1] - a[1])[0] || [];

  return topEmotion || '-';
}

function getMostActiveTimeRange(filteredDailyReports) {
  const counter = {};

  Object.values(filteredDailyReports).forEach((report) => {
    const range = report.activeTimeRange || '-';
    counter[range] = (counter[range] || 0) + 1;
  });

  const [topRange] =
    Object.entries(counter).sort((a, b) => b[1] - a[1])[0] || [];

  return topRange || '-';
}

function buildSummaryTimeline(filteredDailyReports) {
  return Object.values(filteredDailyReports)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, 3)
    .map((report, index) => ({
      id: index + 1,
      title: report.summaryTitle,
      description: report.mainConcern,
    }));
}

function buildHeroBots() {
  return BOT_OPTIONS.map((bot) => ({
    ...bot,
    ...HERO_REPORT_MAP[bot.key],
  }));
}

function buildEmotionTabData(selectedBot, filteredDailyReports) {
  const botAnalysis = BOT_ANALYSIS_MAP[selectedBot.key] || BOT_ANALYSIS_MAP.cat;
  const heroBots = buildHeroBots();
  const selectedHero =
    heroBots.find((hero) => hero.key === selectedBot.key) || heroBots[0];

  const topTopics = getTopTopics(filteredDailyReports);
  const totalConversations = Object.values(filteredDailyReports).reduce(
    (sum, report) => sum + (report.conversationCount || 0),
    0
  );

  const latestTimeline = buildSummaryTimeline(filteredDailyReports);

  return {
    heroBots,
    selectedHero,
    statCards: [
      {
        id: 'conversation-count',
        label: '대화량',
        value: `${totalConversations}회`,
        caption: '선택 기간 동안 기록된 대화 횟수',
      },
      {
        id: 'stability',
        label: '안정도',
        value: `${botAnalysis.stability}%`,
        caption: '감정이 급격히 무너지지 않은 흐름',
      },
      {
        id: 'recovery',
        label: '회복도',
        value: `${botAnalysis.recovery}%`,
        caption: '감정이 다시 정리되는 힘',
      },
      {
        id: 'acceptance',
        label: '자기수용',
        value: `${botAnalysis.acceptance}%`,
        caption: '자책보다 수용으로 이동한 흐름',
      },
    ],
    coreEmotion: {
      title: botAnalysis.coreTitle,
      description: botAnalysis.coreDescription,
      tags: topTopics.length ? topTopics.slice(0, 4) : botAnalysis.defaultTopics,
    },
    emotionDistribution: {
      total: totalConversations || 0,
      items: botAnalysis.distribution,
    },
    emotionFlow: botAnalysis.flow,
    topicTags: topTopics.length ? topTopics : botAnalysis.defaultTopics,
    summaryTimeline:
      latestTimeline.length > 0
        ? latestTimeline
        : [
            {
              id: 1,
              title: '아직 요약 가능한 타임라인이 충분하지 않아요.',
              description: '대화 기록이 더 쌓이면 여기서 감정 흐름을 더 풍부하게 보여줄 수 있어요.',
            },
          ],
  };
}

function buildHistoryOverview(filteredDailyReports) {
  const dateCount = Object.keys(filteredDailyReports).length;

  return {
    conversationCount: `${dateCount}일`,
    strongestEmotion: getStrongestEmotion(filteredDailyReports),
    activeTimeRange: getMostActiveTimeRange(filteredDailyReports),
    latestDateKey: getLastDateKey(filteredDailyReports),
  };
}

function useEmotionReport() {
  const [activeTab, setActiveTab] = useState('emotion');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedBotKey, setSelectedBotKey] = useState('cat');

  const filteredDailyReports = useMemo(
    () => filterDailyReportsByPeriod(DAILY_REPORTS, selectedPeriod),
    [selectedPeriod]
  );

  const [selectedDate, setSelectedDate] = useState(
    getLastDateKey(filteredDailyReports)
  );

  useEffect(() => {
    if (!filteredDailyReports[selectedDate]) {
      setSelectedDate(getLastDateKey(filteredDailyReports));
    }
  }, [filteredDailyReports, selectedDate]);

  const selectedBot = useMemo(
    () => BOT_OPTIONS.find((bot) => bot.key === selectedBotKey) || BOT_OPTIONS[0],
    [selectedBotKey]
  );

  const botMeta = useMemo(
    () =>
      BOT_OPTIONS.reduce((acc, bot) => {
        acc[bot.key] = bot;
        return acc;
      }, {}),
    []
  );

  const emotionTabData = useMemo(
    () => buildEmotionTabData(selectedBot, filteredDailyReports),
    [selectedBot, filteredDailyReports]
  );

  const historyOverview = useMemo(
    () => buildHistoryOverview(filteredDailyReports),
    [filteredDailyReports]
  );

  const chatHistoryTabData = useMemo(
    () => ({
      selectedDate,
      selectedBotKey,
      dailyReports: filteredDailyReports,
      botReports: BOT_HISTORY_REPORTS,
      botMeta,
      overview: historyOverview,
    }),
    [selectedDate, selectedBotKey, filteredDailyReports, botMeta, historyOverview]
  );

  const reportData = useMemo(
    () => ({
      activeTab,
      selectedPeriod,
      selectedBotKey,
      selectedDate,
      emotionTab: emotionTabData,
      chatHistoryTab: chatHistoryTabData,
      chatHistoryTabData,
    }),
    [
      activeTab,
      selectedPeriod,
      selectedBotKey,
      selectedDate,
      emotionTabData,
      chatHistoryTabData,
    ]
  );

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
  };

  const handlePeriodChange = (periodKey) => {
    setSelectedPeriod(periodKey);
  };

  const handleBotChange = (botKey) => {
    setSelectedBotKey(botKey);
  };

  const handleDateChange = (dateKey) => {
    setSelectedDate(dateKey);
  };

  return {
    activeTab,
    selectedPeriod,
    selectedBotKey,
    selectedBot,
    selectedDate,
    tabOptions: REPORT_TAB_OPTIONS,
    periodOptions: REPORT_PERIOD_OPTIONS,
    botOptions: BOT_OPTIONS,
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
