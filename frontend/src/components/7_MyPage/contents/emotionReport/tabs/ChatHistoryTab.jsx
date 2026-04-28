/**
 * ChatHistoryTab 컴포넌트
 * * 용도:
 * 1. 서비스('Matey') 내 사용자의 과거 대화 기록을 날짜별, 채팅방별로 조회하는 히스토리 탭 UI입니다.
 * 2. 캘린더 인터페이스를 통해 특정 날짜를 선택하고, 해당 날짜에 생성된 여러 채팅방 목록을 탐색할 수 있습니다.
 * 3. 선택된 채팅방의 대화 내역(Preview)과 더불어, 각 AI 상담사(봇) 캐릭터별 감정 분석 리포트 및 인사이트를 제공합니다.
 * 4. 프로젝트 'Huggy' 및 'Matey'의 주요 기능인 감정 분석 데이터(Mood Score, Tag, Summary)를 시각화하여 보여주는 역할을 합니다.
 */

import React, { useEffect, useMemo, useState } from 'react';
import styles from './ChatHistoryTab.module.css';

const CHARACTER_IMAGE_MAP = {
  cat: '/images/emotion-report/cat.png',
  bear: '/images/emotion-report/bear.png',
  dog: '/images/emotion-report/dog.png',
  hamster: '/images/emotion-report/hamster.png',
};

const COUNSELOR_FALLBACKS = [
  {
    key: 'cat',
    label: '냥이',
    role: '섬세한 관찰형',
    accentColor: '#9a85ff',
    softColor: '#f2ecff',
    fallbackIcon: '🐱',
  },
  {
    key: 'bear',
    label: '곰이',
    role: '안정적인 공감형',
    accentColor: '#ff9db8',
    softColor: '#fff0f5',
    fallbackIcon: '🐻',
  },
  {
    key: 'dog',
    label: '강아지',
    role: '활기찬 지지형',
    accentColor: '#7db8ff',
    softColor: '#edf6ff',
    fallbackIcon: '🐶',
  },
  {
    key: 'hamster',
    label: '햄이',
    role: '차분한 정리형',
    accentColor: '#ffbf7b',
    softColor: '#fff7eb',
    fallbackIcon: '🐹',
  },
];

const FALLBACK_CHAT_HISTORY_DATA = {
  entries: [
    {
      date: '2026-04-27',
      memo: '업무 압박과 인간관계 피로가 함께 쌓여서 마음이 예민했던 하루예요.',
      summary:
        '대화 전반에서 “혼자 감당해야 한다”는 부담감이 반복되었고, 동시에 누군가에게 기대고 싶은 마음도 함께 드러났어요.',
      moodLabel: '긴장과 회복 사이',
      moodScore: '74%',
      tags: ['업무 스트레스', '관계 피로', '회복 욕구'],
      rooms: [
        {
          id: 'room-1',
          title: '그날의 채팅방',
          subtitle: '업무와 감정이 겹쳐 답답했던 흐름',
          timeRange: '오후 8:10 ~ 8:34',
          messageCount: 6,
          keywords: ['압박감', '정리 욕구', '지침'],
          summary:
            '오늘 해야 할 일이 겹치며 불안이 커졌고, 정리되지 않은 감정을 말로 꺼내면서 진정하려는 흐름이 보였어요.',
          messages: [
            {
              speaker: 'user',
              text: '오늘은 이상하게 계속 마음이 쫓기는 느낌이었어. 해야 할 일은 많은데 집중이 안 되더라.',
              time: '오후 8:10',
            },
            {
              speaker: 'assistant',
              text: '해야 할 일보다 그걸 감당해야 한다는 압박이 더 크게 느껴졌을 수도 있겠어요. 지금 가장 답답했던 순간이 언제였나요?',
              time: '오후 8:12',
            },
            {
              speaker: 'user',
              text: '퇴근 직전에 한꺼번에 일이 몰렸을 때. 다들 아무렇지 않게 하는데 나만 벅찬 느낌이었어.',
              time: '오후 8:18',
            },
            {
              speaker: 'assistant',
              text: '비교가 들어오는 순간 스스로를 더 몰아붙이게 되죠. 오늘은 잘 해내는 것보다, 벅찼다는 사실을 인정하는 게 먼저일 수 있어요.',
              time: '오후 8:21',
            },
            {
              speaker: 'user',
              text: '맞아. 인정하지 않으니까 더 쌓였던 것 같아.',
              time: '오후 8:28',
            },
            {
              speaker: 'assistant',
              text: '그걸 알아차린 것만으로도 이미 회복이 시작된 거예요. 오늘은 끝내지 못한 일보다, 멈출 줄 아는 힘을 챙겨보면 좋겠어요.',
              time: '오후 8:34',
            },
          ],
          counselorReports: {
            cat: {
              title: '세밀하게 보면 “비교”가 피로를 키운 하루였어요',
              summary:
                '업무량 자체보다 “다른 사람은 괜찮아 보이는데 왜 나만 힘들지?”라는 비교의 감정이 더 크게 작동했어요.',
              insight:
                '오늘의 핵심은 능력 부족이 아니라, 피곤한 상태에서 스스로를 더 압박했다는 점이에요. 비교의 시선을 조금만 내려놓아도 피로감은 꽤 줄어들 수 있어요.',
              focusTags: ['자기비교', '압박감', '회복 신호'],
              actions: [
                '오늘 마무리 전에 “지금 내가 버거운 이유 1가지”를 짧게 적어보기',
                '남은 일 목록보다 내일로 넘겨도 되는 일 1개 먼저 고르기',
                '잠들기 전 10분만이라도 업무 생각을 끊는 정리 루틴 만들기',
              ],
            },
          },
        },
        {
          id: 'room-2',
          title: '새벽 감정방',
          subtitle: '관계 피로와 서운함을 조용히 풀어낸 대화',
          timeRange: '오후 11:40 ~ 오후 11:58',
          messageCount: 4,
          keywords: ['서운함', '거리감', '표현 망설임'],
          summary:
            '가까운 사람에게 서운했던 감정을 바로 표현하지 못하고 혼자 곱씹는 패턴이 드러났어요.',
          messages: [
            {
              speaker: 'user',
              text: '요즘은 가까운 사람이 오히려 더 어렵게 느껴져. 서운한 게 있어도 바로 말을 못 하겠어.',
              time: '오후 11:40',
            },
            {
              speaker: 'assistant',
              text: '상처받을까 봐, 혹은 관계 분위기가 틀어질까 봐 망설이는 마음이 있는 것 같아요.',
              time: '오후 11:44',
            },
            {
              speaker: 'user',
              text: '응. 괜히 예민한 사람처럼 보일까 봐. 그래서 그냥 넘기는데 계속 마음에 남아.',
              time: '오후 11:50',
            },
            {
              speaker: 'assistant',
              text: '표현을 미루는 건 관계를 지키려는 방식이지만, 동시에 내 감정을 오래 붙잡게 만들기도 해요.',
              time: '오후 11:58',
            },
          ],
        },
      ],
      counselorReports: {
        bear: {
          title: '오늘은 나를 다독이는 방식이 더 중요했어요',
          summary:
            '하루 내내 많은 자극이 있었지만, 결국 가장 오래 남은 건 “나 자신을 너무 몰아붙였다”는 피로였어요.',
          insight:
            '완벽하게 버티는 하루보다, 스스로를 덜 다그치는 하루가 더 회복에 가깝습니다. 오늘의 감정은 약함이 아니라 과부하의 신호예요.',
          focusTags: ['자기돌봄', '과부하', '감정 안정'],
          actions: [
            '오늘 잘한 일 1가지보다 “버틴 순간” 1가지 적기',
            '내 감정을 평가하지 않고 이름 붙여보기',
            '내일 아침 시작 전에 해야 할 일 3개만 다시 정리하기',
          ],
        },
      },
    },
    {
      date: '2026-04-28',
      memo: '생각은 많았지만 조금 더 차분하게 정리하려 했던 흐름이 있었어요.',
      summary:
        '전날보다 말의 속도가 느려졌고, 감정을 바로 해결하기보다 이해하려는 태도가 더 잘 보였어요.',
      moodLabel: '정리와 안정',
      moodScore: '81%',
      tags: ['정리', '차분함', '자기이해'],
      rooms: [
        {
          id: 'room-3',
          title: '아침 정리방',
          subtitle: '복잡한 생각을 정리하면서 출발한 대화',
          timeRange: '오전 7:42 ~ 오전 8:02',
          messageCount: 5,
          keywords: ['계획', '정돈', '안정'],
          summary:
            '감정을 없애려 하기보다, 오늘을 무리 없이 보내는 방향으로 초점을 조정한 대화였어요.',
          messages: [
            {
              speaker: 'user',
              text: '오늘은 무리하지 않고 차분하게 가고 싶어. 일단 해야 할 것부터 정리하려고.',
              time: '오전 7:42',
            },
            {
              speaker: 'assistant',
              text: '좋아요. 감정을 밀어내기보다 하루의 리듬을 다시 잡는 쪽에 가깝네요.',
              time: '오전 7:46',
            },
            {
              speaker: 'user',
              text: '응. 어제처럼 끌려가기보단 내가 정한 순서대로 움직이고 싶어.',
              time: '오전 7:53',
            },
            {
              speaker: 'assistant',
              text: '그 마음이 이미 안정의 시작이에요. 오늘은 완벽보다 순서를 지키는 데 집중해봐요.',
              time: '오전 8:02',
            },
          ],
        },
      ],
    },
  ],
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const cx = (...items) => items.filter(Boolean).join(' ');

const toDateKey = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = `${value.getMonth() + 1}`.padStart(2, '0');
    const d = `${value.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
};

const parseDateSafe = (value) => {
  const key = toDateKey(value);
  if (!key) return null;
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatFullDate = (value) => {
  const date = parseDateSafe(value);
  if (!date) return '';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const formatMonthTitle = (value) => {
  const date = parseDateSafe(value) || new Date();
  return `${date.getMonth() + 1}월 기록`;
};

const isSameMonth = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const buildMonthMatrix = (anchorDate) => {
  const base = anchorDate instanceof Date ? anchorDate : new Date();
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
};

const normalizeMessage = (item, index) => ({
  id: item?.id ?? `message-${index}`,
  speaker:
    item?.speaker === 'assistant' || item?.role === 'assistant' || item?.sender === 'assistant'
      ? 'assistant'
      : 'user',
  text: item?.text ?? item?.message ?? '',
  time: item?.time ?? item?.timestamp ?? '',
});

const normalizeRoom = (room, index) => ({
  id: room?.id ?? `room-${index}`,
  title: room?.title ?? room?.name ?? `대화방 ${index + 1}`,
  subtitle: room?.subtitle ?? room?.description ?? '',
  timeRange: room?.timeRange ?? room?.time ?? '',
  messageCount: room?.messageCount ?? room?.messages?.length ?? 0,
  keywords: Array.isArray(room?.keywords) ? room.keywords : [],
  summary: room?.summary ?? '',
  messages: Array.isArray(room?.messages) ? room.messages.map(normalizeMessage) : [],
  counselorReports: room?.counselorReports ?? {},
});

const normalizeEntry = (entry, dateKey, index) => ({
  id: entry?.id ?? `entry-${index}`,
  date: toDateKey(entry?.date || dateKey),
  memo: entry?.memo ?? entry?.note ?? '',
  summary: entry?.summary ?? '',
  moodLabel: entry?.moodLabel ?? entry?.emotionLabel ?? '감정 흐름',
  moodScore: entry?.moodScore ?? entry?.score ?? '-',
  tags: Array.isArray(entry?.tags) ? entry.tags : [],
  rooms: Array.isArray(entry?.rooms) ? entry.rooms.map(normalizeRoom) : [],
  counselorReports: entry?.counselorReports ?? {},
});

const extractEntries = (data) => {
  if (Array.isArray(data?.entries)) {
    return data.entries.map((entry, index) => normalizeEntry(entry, entry?.date, index));
  }

  if (data?.historyByDate && typeof data.historyByDate === 'object') {
    return Object.entries(data.historyByDate).map(([dateKey, entry], index) =>
      normalizeEntry(entry, dateKey, index),
    );
  }

  return FALLBACK_CHAT_HISTORY_DATA.entries.map((entry, index) =>
    normalizeEntry(entry, entry?.date, index),
  );
};

const resolveCounselors = (rawList = []) => {
  const merged = COUNSELOR_FALLBACKS.map((fallback) => {
    const found = rawList.find(
      (item) =>
        item?.key === fallback.key ||
        item?.id === fallback.key ||
        item?.value === fallback.key,
    );

    return {
      key: fallback.key,
      label: found?.label ?? found?.name ?? fallback.label,
      role: found?.role ?? found?.description ?? fallback.role,
      accentColor: found?.accentColor ?? found?.color ?? fallback.accentColor,
      softColor: found?.softColor ?? fallback.softColor,
      fallbackIcon: found?.fallbackIcon ?? fallback.fallbackIcon,
      imageUrl:
        found?.imageUrl ??
        found?.imagePath ??
        found?.image ??
        CHARACTER_IMAGE_MAP[fallback.key] ??
        '',
    };
  });

  return merged;
};

const buildFallbackReport = (counselor, entry, room) => ({
  title: `${counselor.label}가 본 오늘 대화의 핵심`,
  summary:
    room?.summary ||
    entry?.summary ||
    '오늘의 대화에서는 감정을 억누르기보다, 현재 상태를 이해하려는 흐름이 드러났어요.',
  insight:
    '지금 필요한 건 문제를 빨리 해결하는 것보다, 어떤 순간에 마음이 흔들렸는지 먼저 알아차리는 일이에요. 감정의 원인을 파악하면 다음 선택은 훨씬 부드러워질 수 있어요.',
  focusTags: room?.keywords?.length ? room.keywords : entry?.tags?.slice(0, 3) ?? [],
  actions: [
    '오늘 가장 마음에 남은 장면 1가지를 짧게 적어보기',
    '같은 감정이 반복될 때 떠오르는 생각을 한 줄로 정리하기',
    '지금 당장 바꿀 수 있는 작은 행동 1개만 선택하기',
  ],
});

function ChatHistoryTab({ data = {}, selectedPeriod, periodOptions = [] }) {
  const counselors = useMemo(
    () => resolveCounselors(data?.counselors ?? data?.bots ?? []),
    [data],
  );

  const entries = useMemo(() => extractEntries(data), [data]);

  const entryMap = useMemo(() => {
    const map = new Map();
    entries.forEach((entry) => {
      if (entry.date) map.set(entry.date, entry);
    });
    return map;
  }, [entries]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [entries],
  );

  const initialDateKey = sortedEntries[0]?.date ?? toDateKey(new Date());

  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const [visibleMonth, setVisibleMonth] = useState(parseDateSafe(initialDateKey) ?? new Date());
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedCounselorKey, setSelectedCounselorKey] = useState(counselors[0]?.key ?? 'cat');

  useEffect(() => {
    setSelectedDateKey(initialDateKey);
    setVisibleMonth(parseDateSafe(initialDateKey) ?? new Date());
  }, [initialDateKey]);

  const selectedEntry = entryMap.get(selectedDateKey) ?? null;

  useEffect(() => {
    const firstRoomId = selectedEntry?.rooms?.[0]?.id ?? '';
    setSelectedRoomId(firstRoomId);
  }, [selectedDateKey, selectedEntry?.rooms]);

  const activeRoom =
    selectedEntry?.rooms?.find((room) => room.id === selectedRoomId) ??
    selectedEntry?.rooms?.[0] ??
    null;

  const activeCounselor =
    counselors.find((item) => item.key === selectedCounselorKey) ?? counselors[0];

  const report =
    activeRoom?.counselorReports?.[selectedCounselorKey] ??
    selectedEntry?.counselorReports?.[selectedCounselorKey] ??
    buildFallbackReport(activeCounselor, selectedEntry, activeRoom);

  const monthMatrix = useMemo(() => buildMonthMatrix(visibleMonth), [visibleMonth]);

  const selectedDate = parseDateSafe(selectedDateKey);
  const entryDaysCount = entries.length;
  const totalRoomsCount = entries.reduce((sum, entry) => sum + entry.rooms.length, 0);

  const periodLabel = useMemo(() => {
    if (!selectedPeriod) return '최근 기록';
    const found = periodOptions.find(
      (option) =>
        option?.key === selectedPeriod ||
        option?.value === selectedPeriod ||
        option?.id === selectedPeriod,
    );
    return found?.label ?? found?.name ?? String(selectedPeriod);
  }, [selectedPeriod, periodOptions]);

  return (
    <div
      className={styles.historyTab}
      style={{
        '--counselor-accent': activeCounselor?.accentColor ?? '#9a85ff',
        '--counselor-soft': activeCounselor?.softColor ?? '#f2ecff',
        '--report-accent': activeCounselor?.accentColor ?? '#9a85ff',
        '--report-soft': activeCounselor?.softColor ?? '#f2ecff',
      }}
    >
      <section className={styles.heroHeader}>
        <div className={styles.heroCopy}>
          <span className={styles.heroKicker}>conversation history</span>
          <h2 className={styles.heroTitle}>메이티 대화 히스토리</h2>
          <p className={styles.heroDescription}>
            날짜를 고르면 그날의 채팅방이 먼저 정리되고, 방을 선택하면 실제 대화 흐름과
            상담사 리포트를 한 번에 볼 수 있도록 구성했어요.
          </p>
        </div>

        <div className={styles.heroMetaRow}>
          <div className={styles.heroMetaCard}>
            <span className={styles.heroMetaLabel}>선택 기간</span>
            <strong className={styles.heroMetaValue}>{periodLabel}</strong>
            <span className={styles.heroMetaSub}>최근 기록 탐색</span>
          </div>
          <div className={styles.heroMetaCard}>
            <span className={styles.heroMetaLabel}>기록 일수</span>
            <strong className={styles.heroMetaValue}>{entryDaysCount}일</strong>
            <span className={styles.heroMetaSub}>대화가 남아 있는 날짜</span>
          </div>
          <div className={styles.heroMetaCard}>
            <span className={styles.heroMetaLabel}>전체 방 수</span>
            <strong className={styles.heroMetaValue}>{totalRoomsCount}개</strong>
            <span className={styles.heroMetaSub}>날짜별 대화방 기준</span>
          </div>
        </div>
      </section>

      <section className={styles.workspaceGrid}>
        <aside className={styles.calendarPanel}>
          <div className={styles.calendarTop}>
            <div>
              <span className={styles.sectionKicker}>daily planner</span>
              <h3 className={styles.calendarTitle}>{formatMonthTitle(visibleMonth)}</h3>
              <p className={styles.calendarSub}>
                달력을 누르면 해당 날짜의 채팅방 목록이 오른쪽에 펼쳐져요.
              </p>
            </div>

            <div className={styles.calendarActions}>
              <button
                type="button"
                className={styles.monthButton}
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
                  )
                }
                aria-label="이전 달"
              >
                ‹
              </button>
              <button
                type="button"
                className={styles.monthButton}
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
                  )
                }
                aria-label="다음 달"
              >
                ›
              </button>
            </div>
          </div>

          <div className={styles.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <div key={day} className={styles.weekdayCell}>
                {day}
              </div>
            ))}
          </div>

          <div className={styles.calendarGrid}>
            {monthMatrix.map((date) => {
              const key = toDateKey(date);
              const entry = entryMap.get(key);
              const muted = !isSameMonth(date, visibleMonth);
              const selected = selectedDate && isSameDay(date, selectedDate);
              const today = isSameDay(date, new Date());

              return (
                <button
                  key={key}
                  type="button"
                  className={cx(
                    styles.dayCell,
                    muted && styles.dayCellMuted,
                    entry && styles.dayCellHasEntry,
                    today && styles.dayCellToday,
                    selected && styles.dayCellSelected,
                  )}
                  onClick={() => setSelectedDateKey(key)}
                >
                  <span className={styles.dayNumber}>{date.getDate()}</span>
                  <span className={styles.dayMeta}>
                    {entry ? (
                      <>
                        <span className={styles.dayDot} />
                        <span className={styles.dayCount}>{entry.rooms.length}</span>
                      </>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.calendarFooter}>
            <div className={styles.calendarFooterCard}>
              <span className={styles.calendarFooterLabel}>선택한 날짜</span>
              <strong className={styles.calendarFooterValue}>
                {selectedDateKey ? formatFullDate(selectedDateKey) : '날짜를 선택해 주세요'}
              </strong>
            </div>
            <div className={styles.calendarFooterCard}>
              <span className={styles.calendarFooterLabel}>대화방 수</span>
              <strong className={styles.calendarFooterValue}>
                {selectedEntry ? `${selectedEntry.rooms.length}개 방` : '기록 없음'}
              </strong>
            </div>
          </div>
        </aside>

        <div className={styles.contentArea}>
          <section className={styles.dayOverviewCard}>
            <div className={styles.dayOverviewHeader}>
              <div>
                <span className={styles.sectionKicker}>selected day</span>
                <h3 className={styles.dayOverviewTitle}>
                  {selectedDateKey ? formatFullDate(selectedDateKey) : '날짜를 선택해 주세요'}
                </h3>
              </div>
              <span className={styles.dayOverviewBadge}>
                {selectedEntry?.moodLabel ?? '기록 대기'}
              </span>
            </div>

            {selectedEntry ? (
              <>
                <div className={styles.dayOverviewGrid}>
                  <div className={styles.overviewBlock}>
                    <span className={styles.overviewLabel}>오늘의 메모</span>
                    <p className={styles.overviewText}>{selectedEntry.memo}</p>
                  </div>

                  <div className={styles.overviewBlock}>
                    <span className={styles.overviewLabel}>하루 요약</span>
                    <p className={styles.overviewText}>{selectedEntry.summary}</p>
                  </div>

                  <div className={styles.overviewMetrics}>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>감정 온도</span>
                      <strong className={styles.metricValue}>
                        {selectedEntry.moodScore}
                      </strong>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>채팅방 수</span>
                      <strong className={styles.metricValue}>
                        {selectedEntry.rooms.length}개
                      </strong>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>선택 상태</span>
                      <strong className={styles.metricValue}>탐색 가능</strong>
                    </div>
                  </div>
                </div>

                <div className={styles.dayTagRow}>
                  {selectedEntry.tags.map((tag) => (
                    <span key={tag} className={styles.dayTag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>선택한 날짜에는 저장된 대화가 없어요</p>
                <p className={styles.emptyDescription}>
                  달력에서 표시된 날짜를 선택하면 채팅방 목록과 요약이 열립니다.
                </p>
              </div>
            )}
          </section>

          <section className={styles.mainContentGrid}>
            <aside className={styles.roomListPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.sectionKicker}>room list</span>
                  <h3 className={styles.panelTitle}>채팅방 목록</h3>
                </div>
                <span className={styles.panelMeta}>
                  {selectedEntry ? `${selectedEntry.rooms.length}개` : '0개'}
                </span>
              </div>

              {selectedEntry?.rooms?.length ? (
                <div className={styles.roomList}>
                  {selectedEntry.rooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      className={cx(
                        styles.roomListItem,
                        activeRoom?.id === room.id && styles.roomListItemActive,
                      )}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <div className={styles.roomListItemTop}>
                        <strong className={styles.roomListItemTitle}>{room.title}</strong>
                        <span className={styles.roomListItemBadge}>
                          {room.messageCount}개
                        </span>
                      </div>
                      <p className={styles.roomListItemSummary}>
                        {room.subtitle || room.summary}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>표시할 채팅방이 없어요</p>
                  <p className={styles.emptyDescription}>
                    날짜를 다시 선택하거나, 대화가 저장된 날짜를 골라보세요.
                  </p>
                </div>
              )}
            </aside>

            <section className={styles.detailPanel}>
              {activeRoom ? (
                <>
                  <div className={styles.detailHeader}>
                    <div>
                      <span className={styles.sectionKicker}>room detail</span>
                      <h3 className={styles.detailTitle}>{activeRoom.title}</h3>
                      <p className={styles.detailDescription}>
                        {activeRoom.summary || activeRoom.subtitle}
                      </p>
                    </div>

                    <div className={styles.detailHeaderStats}>
                      <div className={styles.detailHeaderStat}>
                        <span className={styles.detailHeaderStatLabel}>대화 시간</span>
                        <strong className={styles.detailHeaderStatValue}>
                          {activeRoom.timeRange || '-'}
                        </strong>
                      </div>
                      <div className={styles.detailHeaderStat}>
                        <span className={styles.detailHeaderStatLabel}>메시지 수</span>
                        <strong className={styles.detailHeaderStatValue}>
                          {activeRoom.messageCount}개
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.roomTagRow}>
                    {(activeRoom.keywords?.length
                      ? activeRoom.keywords
                      : selectedEntry?.tags || []
                    ).map((tag) => (
                      <span key={tag} className={styles.roomTag}>
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <section className={styles.chatSection}>
                    <div className={styles.subHeader}>
                      <div>
                        <span className={styles.sectionKicker}>conversation preview</span>
                        <h4 className={styles.subTitle}>대화 흐름</h4>
                      </div>
                    </div>

                    <div className={styles.messageThread}>
                      {activeRoom.messages.map((message) => (
                        <div
                          key={message.id}
                          className={cx(
                            styles.messageRow,
                            message.speaker === 'assistant'
                              ? styles.messageRowAssistant
                              : styles.messageRowUser,
                          )}
                        >
                          <div
                            className={cx(
                              styles.messageBubble,
                              message.speaker === 'assistant'
                                ? styles.messageBubbleAssistant
                                : styles.messageBubbleUser,
                            )}
                          >
                            <p className={styles.messageText}>{message.text}</p>
                            {message.time ? (
                              <span className={styles.messageTime}>{message.time}</span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className={styles.reportSection}>
                    <div className={styles.subHeader}>
                      <div>
                        <span className={styles.sectionKicker}>counselor report</span>
                        <h4 className={styles.subTitle}>상담사 리포트</h4>
                      </div>
                    </div>

                    <div className={styles.counselorSelector}>
                      {counselors.map((counselor) => (
                        <button
                          key={counselor.key}
                          type="button"
                          className={cx(
                            styles.counselorChip,
                            selectedCounselorKey === counselor.key &&
                              styles.counselorChipActive,
                          )}
                          onClick={() => setSelectedCounselorKey(counselor.key)}
                          style={{
                            '--chip-accent': counselor.accentColor,
                            '--chip-soft': counselor.softColor,
                          }}
                        >
                          <div className={styles.counselorChipImageWrap}>
                            {counselor.imageUrl ? (
                              <img
                                src={counselor.imageUrl}
                                alt={counselor.label}
                                className={styles.counselorChipImage}
                              />
                            ) : (
                              <span className={styles.counselorChipFallback}>
                                {counselor.fallbackIcon}
                              </span>
                            )}
                          </div>

                          <div className={styles.counselorChipText}>
                            <strong>{counselor.label}</strong>
                            <span>{counselor.role}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className={styles.reportCard}>
                      <div className={styles.reportCardTop}>
                        <div className={styles.reportPortraitWrap}>
                          {activeCounselor?.imageUrl ? (
                            <img
                              src={activeCounselor.imageUrl}
                              alt={activeCounselor.label}
                              className={styles.reportPortrait}
                            />
                          ) : (
                            <div className={styles.reportPortraitFallback}>
                              {activeCounselor?.fallbackIcon}
                            </div>
                          )}
                        </div>

                        <div className={styles.reportCardCopy}>
                          <span className={styles.reportLabel}>bot brief</span>
                          <h4 className={styles.reportTitle}>{report.title}</h4>
                          <p className={styles.reportSummary}>{report.summary}</p>
                        </div>
                      </div>

                      <div className={styles.insightBox}>
                        <span className={styles.insightLabel}>INSIGHT</span>
                        <p className={styles.insightText}>{report.insight}</p>
                      </div>

                      <div className={styles.focusTagRow}>
                        {(report.focusTags ?? []).map((tag) => (
                          <span key={tag} className={styles.focusTag}>
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <ul className={styles.actionList}>
                        {(report.actions ?? []).map((action, index) => (
                          <li key={`${action}-${index}`} className={styles.actionItem}>
                            <span className={styles.actionBullet}>{index + 1}</span>
                            <span className={styles.actionText}>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>대화방을 선택해 주세요</p>
                  <p className={styles.emptyDescription}>
                    날짜를 먼저 고른 뒤, 왼쪽 목록에서 채팅방을 선택하면 대화 요약과 상담사
                    리포트가 표시됩니다.
                  </p>
                </div>
              )}
            </section>
          </section>
        </div>
      </section>
    </div>
  );
}

export default ChatHistoryTab;
