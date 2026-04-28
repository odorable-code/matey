import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ChatHistoryTab.module.css';

const cx = (...items) => items.filter(Boolean).join(' ');

const CHARACTER_IMAGE_MAP = {
  cat: '/images/emotion-report/cat.png',
  bear: '/images/emotion-report/bear.png',
  dog: '/images/emotion-report/dog.png',
  hamster: '/images/emotion-report/hamster.png',
};

const CURRENT_YEAR = 2026;
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const getOptionKey = (item) =>
  item?.key ?? item?.value ?? item?.id ?? item?.date ?? item?.day ?? '';

const getOptionLabel = (item) =>
  item?.label ?? item?.name ?? item?.title ?? item?.text ?? item?.date ?? '';

const resolveText = (...values) =>
  values.find((value) => typeof value === 'string' && value.trim()) || '';

const FALLBACK_CHAT_HISTORY_DATA = {
  dateOptions: [
    { key: '04-21', label: '4월 21일' },
    { key: '04-22', label: '4월 22일' },
    { key: '04-23', label: '4월 23일' },
    { key: '04-24', label: '4월 24일' },
    { key: '04-25', label: '4월 25일' },
  ],
  heroBots: [
    {
      key: 'cat',
      name: '냥이',
      typeLabel: '직설형 리포터',
      imageUrl: CHARACTER_IMAGE_MAP.cat,
      fallbackLabel: '냥',
      cardObjectPosition: 'center 14%',
    },
    {
      key: 'bear',
      name: '곰이',
      typeLabel: '든든한 위로형',
      imageUrl: CHARACTER_IMAGE_MAP.bear,
      fallbackLabel: '곰',
      cardObjectPosition: 'center 14%',
    },
    {
      key: 'dog',
      name: '강아지',
      typeLabel: '공감·응원형',
      imageUrl: CHARACTER_IMAGE_MAP.dog,
      fallbackLabel: '강',
      cardObjectPosition: 'center 14%',
    },
    {
      key: 'hamster',
      name: '햄이',
      typeLabel: '세심한 생활형',
      imageUrl: CHARACTER_IMAGE_MAP.hamster,
      fallbackLabel: '햄',
      cardObjectPosition: 'center 14%',
    },
  ],
  byDate: {
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
            {
              id: 'conversation-count',
              label: '대화 조각',
              value: '8개',
              caption: '선택한 날짜에 남은 주요 대화 기록',
            },
            {
              id: 'memo-count',
              label: '메모 수',
              value: '3개',
              caption: '감정 메모와 핵심 포인트',
            },
            {
              id: 'dominant-emotion',
              label: '주 감정',
              value: '불안',
              caption: '가장 강하게 반복된 감정 톤',
            },
            {
              id: 'focus-topic',
              label: '집중 주제',
              value: '시험',
              caption: '대화에서 많이 다뤄진 주제',
            },
          ],
          chatEntries: [
            {
              id: 1,
              time: '09:12',
              speaker: 'me',
              emotion: '불안',
              message: '시험 결과가 생각보다 잘 안 나와서 계속 신경 쓰여.',
            },
            {
              id: 2,
              time: '09:13',
              speaker: 'bot',
              emotion: '공감',
              message:
                '결과 자체보다 “내가 뒤처진 것 같다”는 느낌이 더 크게 남은 것 같아.',
            },
            {
              id: 3,
              time: '09:16',
              speaker: 'me',
              emotion: '비교',
              message: '주변 친구들하고 비교하게 돼서 더 마음이 무거워.',
            },
            {
              id: 4,
              time: '09:18',
              speaker: 'bot',
              emotion: '정리',
              message:
                '비교가 시작되면 감정보다 자책이 먼저 커지는 흐름이 보여. 오늘은 비교를 멈추는 기준 하나만 정해보자.',
            },
          ],
          noteCards: [
            {
              id: 'memo-1',
              title: '메모 01',
              description: '결과보다 비교 때문에 감정이 더 흔들렸다고 느낀 날.',
            },
            {
              id: 'memo-2',
              title: '메모 02',
              description: '해결책보다 “이해받고 싶다”는 욕구가 더 크게 올라온 흐름.',
            },
            {
              id: 'memo-3',
              title: '메모 03',
              description: '밤이 될수록 피로와 자책이 함께 올라오는 패턴이 보였음.',
            },
          ],
          insight: {
            headline: '이 날의 대화는 “비교 → 자책 → 위로 필요” 흐름으로 이어졌어요.',
            description:
              '감정 자체를 없애려 하기보다, 비교가 시작되는 지점을 먼저 알아차리는 게 더 중요해 보여요.',
            meta: [
              { label: '반복 패턴', value: '비교 후 자책' },
              { label: '회복 포인트', value: '작은 기준 재설정' },
              { label: '추천 포커스', value: '밤 루틴 가볍게 정리' },
            ],
            tags: ['비교', '자책', '위로', '회복'],
          },
          botInterpretation: {
            summary:
              '감정이 커진 원인은 결과 자체보다, 스스로를 평가하는 기준이 갑자기 높아진 데 있어 보여요.',
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
            description:
              '해결책보다 위로와 안정이 먼저 필요했던 날로 보이고, 감정을 천천히 내려놓으려는 움직임이 있었어요.',
            chips: ['위로', '안정', '회복 필요'],
          },
          overviewCards: [
            {
              id: 'conversation-count',
              label: '대화 조각',
              value: '6개',
              caption: '선택한 날짜에 남은 주요 대화 기록',
            },
            {
              id: 'memo-count',
              label: '메모 수',
              value: '2개',
              caption: '감정 메모와 핵심 포인트',
            },
            {
              id: 'dominant-emotion',
              label: '주 감정',
              value: '피로',
              caption: '가장 강하게 반복된 감정 톤',
            },
            {
              id: 'focus-topic',
              label: '집중 주제',
              value: '휴식',
              caption: '대화에서 많이 다뤄진 주제',
            },
          ],
          chatEntries: [
            {
              id: 1,
              time: '21:01',
              speaker: 'me',
              emotion: '피로',
              message: '오늘은 하루 종일 버틴 느낌이라 너무 지쳐.',
            },
            {
              id: 2,
              time: '21:03',
              speaker: 'bot',
              emotion: '위로',
              message: '오늘은 잘 버틴 날이야. 해결보다 먼저 쉬어도 괜찮아.',
            },
            {
              id: 3,
              time: '21:05',
              speaker: 'me',
              emotion: '무기력',
              message: '쉬어도 괜히 죄책감이 들어서 편하게 못 쉬겠어.',
            },
            {
              id: 4,
              time: '21:06',
              speaker: 'bot',
              emotion: '안정',
              message: '오늘 쉬는 건 포기가 아니라, 다시 버틸 힘을 만드는 시간이야.',
            },
          ],
          noteCards: [
            {
              id: 'memo-1',
              title: '메모 01',
              description: '몸과 마음이 먼저 지쳐 있었던 흐름.',
            },
            {
              id: 'memo-2',
              title: '메모 02',
              description: '휴식이 필요하지만 쉬는 것에도 죄책감을 느낌.',
            },
          ],
          insight: {
            headline: '이 날의 대화는 “피로 → 위로 필요 → 쉼 허용하기”로 이어졌어요.',
            description:
              '성과보다 회복을 우선순위에 두는 연습이 필요한 날처럼 보여요.',
            meta: [
              { label: '반복 패턴', value: '피로 후 죄책감' },
              { label: '회복 포인트', value: '휴식 허용' },
              { label: '추천 포커스', value: '마감 루틴 단순화' },
            ],
            tags: ['피로', '휴식', '위로', '회복'],
          },
          botInterpretation: {
            summary:
              '오늘은 해결하려고 애쓰기보다, 지친 마음을 안전하게 내려놓는 게 더 중요해 보여요.',
            bullets: [
              '지친 날일수록 자기비판이 같이 올라오는 패턴이 보여요.',
              '회복은 미루는 것이 아니라 다음 움직임을 위한 준비예요.',
              '오늘의 핵심은 생산성보다 안정이에요.',
            ],
          },
        },
      ],
    },
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
            description:
              '불안과 걱정은 있었지만, 작게라도 다시 해보려는 의지가 대화 안에 드러났어요.',
            chips: ['응원', '작은 실행', '다시 시작'],
          },
          overviewCards: [
            {
              id: 'conversation-count',
              label: '대화 조각',
              value: '7개',
              caption: '선택한 날짜에 남은 주요 대화 기록',
            },
            {
              id: 'memo-count',
              label: '메모 수',
              value: '3개',
              caption: '감정 메모와 핵심 포인트',
            },
            {
              id: 'dominant-emotion',
              label: '주 감정',
              value: '걱정',
              caption: '가장 강하게 반복된 감정 톤',
            },
            {
              id: 'focus-topic',
              label: '집중 주제',
              value: '다시 시작',
              caption: '대화에서 많이 다뤄진 주제',
            },
          ],
          chatEntries: [
            {
              id: 1,
              time: '08:34',
              speaker: 'me',
              emotion: '걱정',
              message: '어제 못한 걸 오늘도 못할까 봐 걱정돼.',
            },
            {
              id: 2,
              time: '08:35',
              speaker: 'bot',
              emotion: '응원',
              message: '오늘은 다 해내는 것보다, 다시 시작했다는 사실이 더 중요해.',
            },
            {
              id: 3,
              time: '08:40',
              speaker: 'me',
              emotion: '의지',
              message: '그럼 진짜 작은 것 하나만 해볼까 싶어.',
            },
            {
              id: 4,
              time: '08:41',
              speaker: 'bot',
              emotion: '격려',
              message: '좋아. 작게 시작하면 훨씬 덜 무겁게 다시 움직일 수 있어.',
            },
          ],
          noteCards: [
            {
              id: 'memo-1',
              title: '메모 01',
              description: '불안은 있었지만 멈추지 않으려는 흐름이 보인 날.',
            },
            {
              id: 'memo-2',
              title: '메모 02',
              description: '큰 계획보다 작은 시작이 더 중요했던 날.',
            },
          ],
          insight: {
            headline: '이 날의 대화는 “걱정 → 다시 시도 → 작은 실행” 흐름으로 이어졌어요.',
            description:
              '성공보다 재시작 자체에 의미를 두는 태도가 도움이 되는 날이었어요.',
            meta: [
              { label: '반복 패턴', value: '걱정 후 시도' },
              { label: '회복 포인트', value: '작게 시작하기' },
              { label: '추천 포커스', value: '첫 행동 낮추기' },
            ],
            tags: ['걱정', '시도', '응원', '시작'],
          },
          botInterpretation: {
            summary:
              '완벽하게 하려는 부담보다, 다시 움직이려는 힘이 더 중요하게 보였어요.',
            bullets: [
              '작게 시작했을 때 감정 부담이 줄어드는 패턴이 보여요.',
              '응원과 지지가 행동으로 이어지는 연결이 있어요.',
              '오늘은 결과보다 재시작 자체를 인정해주는 게 중요해요.',
            ],
          },
        },
      ],
    },
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
            description:
              '수면과 하루 루틴이 흔들리면서 감정 기복도 함께 커졌고, 정리가 필요한 흐름이 보였어요.',
            chips: ['루틴', '생활 정리', '수면'],
          },
          overviewCards: [
            {
              id: 'conversation-count',
              label: '대화 조각',
              value: '5개',
              caption: '선택한 날짜에 남은 주요 대화 기록',
            },
            {
              id: 'memo-count',
              label: '메모 수',
              value: '2개',
              caption: '감정 메모와 핵심 포인트',
            },
            {
              id: 'dominant-emotion',
              label: '주 감정',
              value: '예민함',
              caption: '가장 강하게 반복된 감정 톤',
            },
            {
              id: 'focus-topic',
              label: '집중 주제',
              value: '수면',
              caption: '대화에서 많이 다뤄진 주제',
            },
          ],
          chatEntries: [
            {
              id: 1,
              time: '10:02',
              speaker: 'me',
              emotion: '예민함',
              message: '잠을 설쳐서 그런지 사소한 것도 다 거슬려.',
            },
            {
              id: 2,
              time: '10:05',
              speaker: 'bot',
              emotion: '정리',
              message: '오늘 감정은 마음 문제이기도 하지만, 생활 리듬 영향도 커 보여.',
            },
          ],
          noteCards: [
            {
              id: 'memo-1',
              title: '메모 01',
              description: '수면 부족이 감정 예민함으로 연결된 날.',
            },
            {
              id: 'memo-2',
              title: '메모 02',
              description: '큰 해결보다 루틴 회복이 우선인 흐름.',
            },
          ],
          insight: {
            headline: '이 날의 대화는 “수면 흔들림 → 예민함 증가” 흐름으로 이어졌어요.',
            description:
              '감정 해석과 함께 생활 리듬 점검이 같이 필요한 날이었어요.',
            meta: [
              { label: '반복 패턴', value: '수면 후 예민함' },
              { label: '회복 포인트', value: '루틴 복구' },
              { label: '추천 포커스', value: '취침 전 정리' },
            ],
            tags: ['수면', '루틴', '예민함', '정리'],
          },
          botInterpretation: {
            summary:
              '오늘의 감정은 생각보다 생활 리듬과 더 밀접하게 연결돼 있어 보여요.',
            bullets: [
              '생활 패턴이 흔들릴수록 감정 반응도 커져요.',
              '작은 루틴 회복이 전체 안정에 도움이 돼요.',
              '자기비난보다 생활 리듬 점검이 먼저예요.',
            ],
          },
        },
      ],
    },
  },
};

const parseFlexibleDate = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

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

const formatMonthKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const formatFullDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

const formatShortKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
    2,
    '0',
  )}`;
};

const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const buildCalendarMatrix = (anchorDate) => {
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    return current;
  });
};

const normalizeDateOptions = (sourceData = {}, historyOverview = null) => {
  const raw =
    sourceData?.dateOptions ||
    sourceData?.dates ||
    historyOverview?.dateOptions ||
    FALLBACK_CHAT_HISTORY_DATA.dateOptions;

  const normalized =
    Array.isArray(raw) && raw.length > 0
      ? raw
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
              monthKey: date ? formatMonthKey(date) : '',
            };
          })
          .filter((item) => item.key)
      : [];

  if (normalized.length > 0) return normalized;

  return FALLBACK_CHAT_HISTORY_DATA.dateOptions.map((item) => {
    const date = parseFlexibleDate(item.key) || parseFlexibleDate(item.label);
    return {
      key: item.key,
      label: item.label,
      date,
      fullKey: date ? formatFullDateKey(date) : '',
      shortKey: date ? formatShortKey(date) : '',
      monthKey: date ? formatMonthKey(date) : '',
    };
  });
};

const normalizeChatEntries = (raw) => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return FALLBACK_CHAT_HISTORY_DATA.byDate['04-21'].chatRooms[0].chatEntries;
  }

  return raw.map((entry, index) => {
    const rawSpeaker = `${entry?.speaker || entry?.role || entry?.type || ''}`.toLowerCase();
    const speaker =
      rawSpeaker.includes('bot') || rawSpeaker.includes('assistant')
        ? 'bot'
        : rawSpeaker.includes('system')
          ? 'bot'
          : 'me';

    return {
      id: entry?.id ?? index,
      time: resolveText(entry?.time, entry?.timestamp, entry?.dateTime) || '--:--',
      speaker,
      emotion: resolveText(entry?.emotion, entry?.tag, entry?.label),
      message: resolveText(entry?.message, entry?.text, entry?.content, entry?.summary),
    };
  });
};

const resolveScopedData = (sourceData, currentDateOption) => {
  const keyCandidates = [
    currentDateOption?.key,
    currentDateOption?.fullKey,
    currentDateOption?.shortKey,
    currentDateOption?.label,
  ].filter(Boolean);

  const objectMaps = [
    sourceData?.dailyData,
    sourceData?.byDate,
    sourceData?.dateMap,
    sourceData?.historyByDate,
  ];

  for (const map of objectMaps) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) continue;
    for (const key of keyCandidates) {
      if (map[key]) return map[key];
    }
  }

  const entryList = sourceData?.entries || sourceData?.history;
  if (Array.isArray(entryList) && entryList.length > 0) {
    const matched = entryList.find((entry) => {
      const rawDate = entry?.date || entry?.dateKey || entry?.key || entry?.label;
      const date = parseFlexibleDate(rawDate);
      const fullKey = date ? formatFullDateKey(date) : '';
      const shortKey = date ? formatShortKey(date) : '';
      const entryKey = entry?.dateKey || entry?.key || rawDate;

      return keyCandidates.some(
        (key) => key === rawDate || key === fullKey || key === shortKey || key === entryKey,
      );
    });

    if (matched) return matched;
  }

  return sourceData;
};

const resolveBotProfile = (botKey, mergedBots = []) => {
  const target =
    mergedBots.find(
      (item) => item?.key === botKey || item?.id === botKey || item?.value === botKey,
    ) || mergedBots[0];

  if (!target) {
    return {
      key: botKey || 'cat',
      name: '봇',
      typeLabel: '대화 해석 봇',
      imageUrl: CHARACTER_IMAGE_MAP[botKey] || '',
      fallbackLabel: '봇',
      cardObjectPosition: 'center 14%',
    };
  }

  const resolvedKey = target?.key || target?.id || target?.value || botKey || 'cat';

  return {
    ...target,
    key: resolvedKey,
    name: target?.name || target?.label || '봇',
    typeLabel: target?.typeLabel || target?.description || '대화 해석 봇',
    imageUrl:
      target?.imageUrl ||
      target?.imagePath ||
      CHARACTER_IMAGE_MAP[resolvedKey] ||
      '',
    fallbackLabel: target?.fallbackLabel || (target?.name || '봇').slice(0, 1),
    cardObjectPosition: target?.cardObjectPosition || 'center 14%',
  };
};

const normalizeRoomItem = (room, index, mergedBots = [], fallbackBotKey = 'cat') => {
  const botKey =
    room?.botKey ||
    room?.selectedBotKey ||
    room?.bot?.key ||
    fallbackBotKey;

  const botProfile = resolveBotProfile(botKey, mergedBots);
  const entries = normalizeChatEntries(
    room?.chatEntries || room?.chatLogs || room?.messages || room?.timeline,
  );
  const lastEntry = entries[entries.length - 1];

  return {
    id: room?.id ?? room?.roomId ?? `${botKey}-${index}`,
    botKey,
    botProfile,
    title: resolveText(room?.title, room?.name) || `${botProfile.name}와의 대화`,
    lastMessage:
      resolveText(room?.lastMessage, room?.preview, room?.summaryText) ||
      lastEntry?.message ||
      '대화 내용이 없어요.',
    lastTime: resolveText(room?.lastTime, room?.time, lastEntry?.time),
    summary: room?.summary,
    overviewCards: room?.overviewCards,
    chatEntries: entries,
    noteCards: room?.noteCards || room?.notes || room?.memos,
    insight: room?.insight,
    botInterpretation: room?.botInterpretation,
  };
};

const normalizeChatRooms = (scopedData, sourceData, mergedBots, fallbackBotKey) => {
  const raw =
    scopedData?.chatRooms ||
    scopedData?.rooms ||
    scopedData?.conversationRooms ||
    sourceData?.chatRooms ||
    sourceData?.rooms ||
    [];

  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((room, index) =>
      normalizeRoomItem(room, index, mergedBots, fallbackBotKey),
    );
  }

  return [
    normalizeRoomItem(
      {
        id: scopedData?.id || 'default-room',
        botKey:
          scopedData?.selectedBotKey ||
          scopedData?.botKey ||
          scopedData?.bot?.key ||
          fallbackBotKey,
        title: '대화방',
        lastMessage: resolveText(
          scopedData?.lastMessage,
          scopedData?.summary?.title,
          scopedData?.summary?.description,
        ),
        summary: scopedData?.summary,
        overviewCards: scopedData?.overviewCards,
        chatEntries:
          scopedData?.chatEntries ||
          scopedData?.chatLogs ||
          scopedData?.messages ||
          scopedData?.timeline,
        noteCards: scopedData?.noteCards || scopedData?.notes || scopedData?.memos,
        insight: scopedData?.insight,
        botInterpretation: scopedData?.botInterpretation,
      },
      0,
      mergedBots,
      fallbackBotKey,
    ),
  ];
};

function splitAnimatedValue(rawValue) {
  const text = String(rawValue ?? '');
  const match = text.match(/^(-?\d+(?:\.\d+)?)(.*)$/);

  if (!match) {
    return {
      numericValue: 0,
      suffix: text,
      hasNumber: false,
    };
  }

  return {
    numericValue: Number(match[1]) || 0,
    suffix: match[2] || '',
    hasNumber: true,
  };
}

function AnimatedValue({
  value,
  duration = 900,
  className,
  decimals = 0,
  animateOnlyOnMount = true,
}) {
  const { numericValue, suffix, hasNumber } = splitAnimatedValue(value);
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!hasNumber) return undefined;

    if (animateOnlyOnMount && hasAnimatedRef.current) {
      setDisplayValue(numericValue);
      return undefined;
    }

    let frameId = null;
    let startTime = null;
    hasAnimatedRef.current = true;
    setDisplayValue(0);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = numericValue * eased;

      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [numericValue, duration, hasNumber, animateOnlyOnMount]);

  if (!hasNumber) {
    return <span className={className}>{value}</span>;
  }

  const finalText =
    decimals > 0
      ? `${displayValue.toFixed(decimals)}${suffix}`
      : `${Math.round(displayValue)}${suffix}`;

  return <span className={className}>{finalText}</span>;
}

function ChatHistoryTab({
  data,
  selectedDate,
  onDateChange,
  selectedBotKey,
  botOptions = [],
  reportData,
  historyOverview,
}) {
  const sourceData =
    data ||
    reportData?.chatHistoryTab ||
    historyOverview ||
    FALLBACK_CHAT_HISTORY_DATA;

  const dateOptions = useMemo(
    () => normalizeDateOptions(sourceData, historyOverview),
    [sourceData, historyOverview],
  );

  const currentDateKey = useMemo(() => {
    if (!dateOptions.length) return '';

    const matched = dateOptions.find(
      (item) =>
        item.key === selectedDate ||
        item.fullKey === selectedDate ||
        item.shortKey === selectedDate,
    );

    return matched?.key || dateOptions[0].key;
  }, [selectedDate, dateOptions]);

  const currentDateOption =
    dateOptions.find(
      (item) =>
        item.key === currentDateKey ||
        item.fullKey === currentDateKey ||
        item.shortKey === currentDateKey,
    ) || dateOptions[0];

  const currentDateLabel = currentDateOption?.label || currentDateKey;
  const anchorDate = currentDateOption?.date || new Date(CURRENT_YEAR, 3, 1);

  const calendarMatrix = useMemo(() => buildCalendarMatrix(anchorDate), [anchorDate]);

  const selectableDateMap = useMemo(() => {
    const map = new Map();
    dateOptions.forEach((item) => {
      if (item.fullKey) map.set(item.fullKey, item);
    });
    return map;
  }, [dateOptions]);

  const scopedData = useMemo(
    () => resolveScopedData(sourceData, currentDateOption),
    [sourceData, currentDateOption],
  );

  const mergedBots = useMemo(
    () => [
      ...(Array.isArray(botOptions) ? botOptions : []),
      ...(Array.isArray(reportData?.heroBots) ? reportData.heroBots : []),
      ...(Array.isArray(sourceData?.heroBots) ? sourceData.heroBots : []),
      ...(Array.isArray(FALLBACK_CHAT_HISTORY_DATA.heroBots)
        ? FALLBACK_CHAT_HISTORY_DATA.heroBots
        : []),
    ],
    [botOptions, reportData, sourceData],
  );

  const chatRooms = useMemo(() => {
    const fallbackBotKey =
      scopedData?.selectedBotKey ||
      scopedData?.botKey ||
      scopedData?.bot?.key ||
      selectedBotKey ||
      'cat';

    return normalizeChatRooms(scopedData, sourceData, mergedBots, fallbackBotKey);
  }, [scopedData, sourceData, mergedBots, selectedBotKey]);

  const [selectedRoomId, setSelectedRoomId] = useState(chatRooms[0]?.id || '');

  useEffect(() => {
    if (!chatRooms.length) {
      setSelectedRoomId('');
      return;
    }

    const exists = chatRooms.some((room) => room.id === selectedRoomId);

    if (!exists) {
      setSelectedRoomId(chatRooms[0].id);
    }
  }, [chatRooms, selectedRoomId, currentDateKey]);

  const currentRoom =
    chatRooms.find((room) => room.id === selectedRoomId) || chatRooms[0] || null;

  const roomBot = currentRoom?.botProfile || null;

  const summary =
    currentRoom?.summary ||
    scopedData?.summary ||
    sourceData?.summary ||
    FALLBACK_CHAT_HISTORY_DATA.byDate['04-21'].chatRooms[0].summary;

  const chatEntries = useMemo(() => {
    const raw =
      currentRoom?.chatEntries ||
      scopedData?.chatEntries ||
      scopedData?.chatLogs ||
      scopedData?.messages ||
      scopedData?.timeline ||
      sourceData?.chatEntries ||
      sourceData?.chatLogs ||
      sourceData?.messages ||
      sourceData?.timeline ||
      FALLBACK_CHAT_HISTORY_DATA.byDate['04-21'].chatRooms[0].chatEntries;

    return normalizeChatEntries(raw);
  }, [currentRoom, scopedData, sourceData]);

  const noteCards = useMemo(() => {
    const raw =
      currentRoom?.noteCards ||
      scopedData?.noteCards ||
      scopedData?.notes ||
      scopedData?.memos ||
      historyOverview?.notes ||
      sourceData?.noteCards ||
      sourceData?.notes ||
      sourceData?.memos ||
      FALLBACK_CHAT_HISTORY_DATA.byDate['04-21'].chatRooms[0].noteCards;

    if (!Array.isArray(raw) || raw.length === 0) {
      return FALLBACK_CHAT_HISTORY_DATA.byDate['04-21'].chatRooms[0].noteCards;
    }

    return raw.map((item, index) => ({
      id: item?.id ?? index,
      title: resolveText(item?.title, item?.label, item?.name) || `메모 ${index + 1}`,
      description: resolveText(
        item?.description,
        item?.text,
        item?.content,
        item?.summary,
      ),
    }));
  }, [currentRoom, scopedData, sourceData, historyOverview]);

  const insight =
    currentRoom?.insight ||
    scopedData?.insight ||
    sourceData?.insight ||
    FALLBACK_CHAT_HISTORY_DATA.byDate['04-21'].chatRooms[0].insight;

  const botInterpretation =
    currentRoom?.botInterpretation ||
    scopedData?.botInterpretation ||
    sourceData?.botInterpretation ||
    FALLBACK_CHAT_HISTORY_DATA.byDate['04-21'].chatRooms[0].botInterpretation;

  const overviewCards = useMemo(() => {
    const raw =
      currentRoom?.overviewCards ||
      scopedData?.overviewCards ||
      sourceData?.overviewCards ||
      historyOverview?.overviewCards ||
      FALLBACK_CHAT_HISTORY_DATA.byDate['04-21'].chatRooms[0].overviewCards;

    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((card, index) => ({
        id: card?.id ?? index,
        label: resolveText(card?.label, card?.title, card?.name),
        value: resolveText(card?.value, card?.count, card?.text),
        caption: resolveText(card?.caption, card?.description, card?.summary),
      }));
    }

    return [
      {
        id: 'conversation-count',
        label: '대화 조각',
        value: `${chatEntries.length}개`,
        caption: '선택 날짜에 남은 주요 대화 기록',
      },
      {
        id: 'memo-count',
        label: '메모 수',
        value: `${noteCards.length}개`,
        caption: '감정 메모와 핵심 포인트',
      },
      {
        id: 'dominant-emotion',
        label: '주 감정',
        value: insight?.tags?.[0] || '안정',
        caption: '가장 강하게 반복된 감정 톤',
      },
      {
        id: 'focus-topic',
        label: '집중 주제',
        value: summary?.chips?.[0] || '일상',
        caption: '대화에서 많이 다뤄진 주제',
      },
    ];
  }, [
    currentRoom,
    scopedData,
    sourceData,
    historyOverview,
    chatEntries.length,
    noteCards.length,
    insight,
    summary,
  ]);

  const insightMeta = Array.isArray(insight?.meta) ? insight.meta : [];
  const summaryChips = Array.isArray(summary?.chips) ? summary.chips : [];
  const insightTags = Array.isArray(insight?.tags) ? insight.tags : [];
  const monthTitle = `${anchorDate.getFullYear()}년 ${anchorDate.getMonth() + 1}월`;

  const mergedTags = [...new Set([...summaryChips, ...insightTags])].slice(0, 5);
  const compactOverviewCards = overviewCards.slice(0, 3);
  const interpretationBullets = Array.isArray(botInterpretation?.bullets)
    ? botInterpretation.bullets.slice(0, 3)
    : [];

  const insightHeadline =
    insight?.headline ||
    summary?.title ||
    '이 날의 대화 흐름을 한눈에 정리했어요.';

  const insightDescription =
    insight?.description ||
    summary?.description ||
    botInterpretation?.summary ||
    '선택한 날짜의 감정 흐름과 핵심 포인트를 요약했어요.';

  const handleDateSelect = (nextKey) => {
    onDateChange?.(nextKey);
  };

  const handleRoomSelect = (roomId) => {
    setSelectedRoomId(roomId);
  };

  return (
    <section className={styles.chatHistoryTab}>
      <div
        className={`${styles.topBar} ${styles.panelEntrance}`}
        style={{ '--enter-delay': '40ms' }}
      >
        <div className={styles.calendarPanel}>
          <div className={styles.calendarHeader}>
            <div>
              <span className={styles.filterLabel}>날짜 선택</span>
              <h3 className={styles.calendarTitle}>{monthTitle}</h3>
              <p className={styles.calendarDescription}>
                기록이 있는 날짜를 선택하면 바로 아래에서 대화 흐름을 볼 수 있어요.
              </p>
            </div>

            <div className={styles.calendarSelectedBadge}>{currentDateLabel}</div>
          </div>

          <div className={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((day) => (
              <div key={day} className={styles.weekdayCell}>
                {day}
              </div>
            ))}
          </div>

          <div className={styles.calendarGrid}>
            {calendarMatrix.map((date) => {
              const fullKey = formatFullDateKey(date);
              const option = selectableDateMap.get(fullKey);
              const isCurrentMonth = date.getMonth() === anchorDate.getMonth();
              const isSelected = currentDateOption?.date
                ? isSameDay(date, currentDateOption.date)
                : false;
              const hasRecord = Boolean(option);

              return (
                <button
                  key={fullKey}
                  type="button"
                  disabled={!hasRecord}
                  onClick={() => option && handleDateSelect(option.key)}
                  className={cx(
                    styles.dayCell,
                    !isCurrentMonth && styles.dayCellMuted,
                    hasRecord && styles.dayCellHasRecord,
                    isSelected && styles.dayCellSelected,
                  )}
                >
                  <span className={styles.dayNumber}>{date.getDate()}</span>
                  {hasRecord ? <span className={styles.dayDot} /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.roomListPanel}>
          <div className={styles.roomListHeader}>
            <div>
              <span className={styles.roomListEyebrow}>대화방</span>
              <strong className={styles.roomListTitle}>선택 가능한 대화</strong>
              <p className={styles.roomListDescription}>
                같은 날짜에 여러 대화가 있으면 여기서 고를 수 있어요.
              </p>
            </div>
          </div>

          <div className={styles.roomList}>
            {chatRooms.map((room) => {
              const active = room.id === currentRoom?.id;

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleRoomSelect(room.id)}
                  className={cx(styles.roomCard, active && styles.roomCardActive)}
                >
                  <div className={styles.roomAvatarWrap}>
                    {room.botProfile?.imageUrl ? (
                      <img
                        src={room.botProfile.imageUrl}
                        alt={`${room.botProfile.name} 초상화`}
                        className={styles.roomAvatar}
                        style={{
                          objectPosition:
                            room.botProfile.cardObjectPosition || 'center 14%',
                        }}
                      />
                    ) : (
                      <div className={styles.roomAvatarFallback}>
                        {room.botProfile?.fallbackLabel || '봇'}
                      </div>
                    )}
                  </div>

                  <div className={styles.roomContent}>
                    <div className={styles.roomTopRow}>
                      <strong className={styles.roomName}>
                        {room.title || `${room.botProfile?.name || '봇'}와의 대화`}
                      </strong>
                      {room.lastTime ? (
                        <span className={styles.roomTime}>{room.lastTime}</span>
                      ) : null}
                    </div>

                    <p className={styles.roomPreview}>{room.lastMessage}</p>

                    <div className={styles.roomMetaRow}>
                      <span className={styles.roomBotBadge}>
                        {room.botProfile?.name || '봇'}
                      </span>
                      <span className={styles.roomTone}>
                        {room.botProfile?.typeLabel || '대화 해석 봇'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.sideColumn}>
          <article
            className={`${styles.insightHero} ${styles.panelEntrance}`}
            style={{ '--enter-delay': '180ms' }}
          >
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>오늘의 요약</span>
                <h3 className={styles.panelTitle}>대화 해석</h3>
              </div>
            </div>

            <strong className={styles.insightHeadline}>{insightHeadline}</strong>
            <p className={styles.insightDescription}>{insightDescription}</p>

            {insightMeta.length > 0 ? (
              <div className={styles.insightRow}>
                {insightMeta.slice(0, 3).map((item) => (
                  <div key={`${item.label}-${item.value}`} className={styles.insightBox}>
                    <span className={styles.insightLabel}>{item.label}</span>
                    <strong className={styles.insightValue}>{item.value}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            {interpretationBullets.length > 0 ? (
              <div className={styles.compactBulletList}>
                {interpretationBullets.map((item) => (
                  <div key={item} className={styles.compactBulletItem}>
                    {item}
                  </div>
                ))}
              </div>
            ) : null}

            {mergedTags.length > 0 ? (
              <div className={styles.tagRow}>
                {mergedTags.map((tag) => (
                  <span key={tag} className={styles.tagChip}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>

          <article
            className={`${styles.memoPanel} ${styles.panelEntrance}`}
            style={{ '--enter-delay': '240ms' }}
          >
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>메모</span>
                <h3 className={styles.panelTitle}>기록된 메모</h3>
              </div>
            </div>

            <div className={styles.memoList}>
              {noteCards.length > 0 ? (
                noteCards.map((item) => (
                  <div key={item.id} className={styles.memoCard}>
                    <strong className={styles.memoTitle}>{item.title}</strong>
                    <p className={styles.memoDescription}>{item.description}</p>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>남아 있는 메모가 없어요.</div>
              )}
            </div>
          </article>
        </div>

        <article
          className={`${styles.timelinePanel} ${styles.panelEntrance}`}
          style={{ '--enter-delay': '120ms' }}
        >
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>대화 흐름</span>
              <h3 className={styles.panelTitle}>
                {currentDateLabel} · {roomBot?.name || '대화방'}
              </h3>
            </div>
            <span className={styles.panelSubcopy}>
              핵심 대화만 가볍게 읽을 수 있게 정리했어요
            </span>
          </div>

          <div className={styles.timelineList}>
            {chatEntries.length > 0 ? (
              chatEntries.map((entry) => {
                const isBot = entry.speaker === 'bot';

                return (
                  <div
                    key={entry.id}
                    className={cx(
                      styles.timelineItem,
                      isBot ? styles.timelineItemBot : styles.timelineItemMe,
                    )}
                  >
                    <div className={styles.timelineMeta}>
                      <span
                        className={cx(
                          styles.speakerBadge,
                          isBot ? styles.speakerBadgeBot : styles.speakerBadgeMe,
                        )}
                      >
                        {isBot ? 'BOT' : 'ME'}
                      </span>

                      {entry.emotion ? (
                        <span className={styles.emotionBadge}>{entry.emotion}</span>
                      ) : null}

                      <span className={styles.timeBadge}>{entry.time}</span>
                    </div>

                    <div
                      className={cx(
                        styles.bubble,
                        isBot ? styles.bubbleBot : styles.bubbleMe,
                      )}
                    >
                      {entry.message}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>아직 정리된 대화 기록이 없어요.</div>
            )}
          </div>
        </article>
      </div>

      <div className={styles.statGrid}>
        {compactOverviewCards.map((card, index) => (
          <article
            key={card.id}
            className={`${styles.statCard} ${styles.panelEntrance}`}
            style={{ '--enter-delay': `${300 + index * 70}ms` }}
          >
            <span className={styles.statLabel}>{card.label}</span>
            <AnimatedValue
              value={card.value}
              className={styles.statValue}
            />
            <p className={styles.statCaption}>{card.caption}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ChatHistoryTab;
