/**
 * [파일 역할]
 * - 감정 리포트 > 대화 히스토리 탭 화면
 * - 날짜 선택(달력), 대화방 선택, 대화 흐름, 메모, 요약 카드까지 모두 담당
 *
 * [여기서 찾을 것]
 * - 달력 UI: calendarGrid 영역
 * - 대화방 목록 UI: roomList 영역
 * - 대화 말풍선 UI: timelineList 영역
 * - 메모 카드 UI: memoPanel 영역
 * - 통계 카드 UI: statGrid 영역
 *
 * [수정 포인트]
 * - 더미 데이터 바꾸기: emotionReport.fallback.js → FALLBACK_CHAT_HISTORY_DATA
 * - 캐릭터 바꾸기: emotionReport.constants.js → FALLBACK_HERO_BOTS
 * - 대화 말풍선 UI 수정: timelineList 영역
 * - 메모/요약 카드 수정: memoPanel / insightHero 영역
 *
 * [이전 대비 달라진 점]
 * - 상수/유틸/더미 데이터 → 전부 공용 파일에서 import
 * - 과잉 방어 코드 제거 (실제 쓰이는 키만 체크)
 * - AnimatedValue → 공용 splitAnimatedValue 사용
 * - 이 파일에는 "화면 렌더링 + 데이터 정리 함수"만 남음
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ChatHistoryTab.module.css';
import { resolveMascotImageSrcBySituationLabel } from '../../../../../utils/botAvatar';

/* =========================
   공용 파일에서 가져오기
========================= */
import {
  CHARACTER_IMAGE_MAP,
  CURRENT_YEAR,
  WEEKDAY_LABELS,
} from '../../../hooks/emotionReport/emotionReport.constants';

import {
  cx,
  getOptionKey,
  getOptionLabel,
  resolveText,
  parseFlexibleDate,
  formatFullDateKey,
  formatShortKey,
  formatMonthKey,
  isSameDay,
  buildCalendarMatrix,
  splitAnimatedValue,
} from '../../../hooks/emotionReport/emotionReport.utils';

// emotionReport.fallback.js의 더미 데이터를 더 이상 사용하지 않는다.

/* =========================
   날짜 옵션 정규화
   - 서버에서 받은 날짜 데이터를 통일된 형태로 변환
   - key, label, date, fullKey, shortKey, monthKey를 모두 갖춘 배열로 반환
========================= */
const normalizeDateOptions = (sourceData = {}, historyOverview = null) => {
  const raw =
    sourceData?.dateOptions ||
    historyOverview?.dateOptions ||
    [];

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

  /* --- 정리된 결과가 있으면 반환, 없으면 기본값 --- */
  if (normalized.length > 0) return normalized;

  // 서버 데이터가 없으면 날짜 더미를 만들지 않고 빈 배열로 둔다.
  return [];
};

/* =========================
   대화 기록 정규화
   - speaker를 'me' 또는 'bot'으로 통일
   - time, emotion, message를 안전하게 꺼냄
========================= */
const normalizeChatEntries = (raw) => {
  /* --- 데이터가 없으면 기본 대화 반환 --- */
  if (!Array.isArray(raw) || raw.length === 0) {
    return [];
  }

  return raw.map((entry, index) => {
    const rawSpeaker = `${entry?.speaker || entry?.role || ''}`.toLowerCase();

    /* --- bot/assistant/system → 'bot', 나머지 → 'me' --- */
    const speaker =
      rawSpeaker.includes('bot') || rawSpeaker.includes('assistant') || rawSpeaker.includes('system')
        ? 'bot'
        : 'me';

    return {
      id: entry?.id ?? index,
      time: resolveText(entry?.time, entry?.timestamp) || '--:--',
      speaker,
      emotion: resolveText(entry?.emotion, entry?.tag),
      message: resolveText(entry?.message, entry?.text, entry?.content),
    };
  });
};

/* =========================
   현재 선택한 날짜 기준으로 데이터 찾기
   - byDate 객체에서 해당 날짜의 데이터를 꺼냄
   - key, fullKey, shortKey 순서로 찾아봄
========================= */
const resolveScopedData = (sourceData, currentDateOption) => {
  /* --- 찾을 key 후보 목록 --- */
  const keyCandidates = [
    currentDateOption?.key,
    currentDateOption?.fullKey,
    currentDateOption?.shortKey,
  ].filter(Boolean);

  /* --- byDate에서 찾기 --- */
  const byDate = sourceData?.byDate;

  if (byDate && typeof byDate === 'object') {
    for (const key of keyCandidates) {
      if (byDate[key]) return byDate[key];
    }
  }

  /* --- 못 찾으면 sourceData 자체 반환 --- */
  return sourceData;
};

/* =========================
   봇 프로필 정리
   - key로 봇을 찾고, 이미지/이름 등 기본값 보정
========================= */
const resolveBotProfile = (botKey, mergedBots = []) => {
  const target =
    mergedBots.find((item) => item?.key === botKey) || mergedBots[0];

  /* --- 봇을 못 찾으면 최소한의 기본 프로필 반환 --- */
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

  const resolvedKey = target?.key || botKey || 'cat';

  return {
    ...target,
    key: resolvedKey,
    name: target?.name || '봇',
    typeLabel: target?.typeLabel || '대화 해석 봇',
    imageUrl:
      target?.imageUrl ||
      CHARACTER_IMAGE_MAP[resolvedKey] ||
      '',
    fallbackLabel: target?.fallbackLabel || (target?.name || '봇').slice(0, 1),
    cardObjectPosition: target?.cardObjectPosition || 'center 14%',
  };
};

/* =========================
   대화방 1개 데이터 정리
   - 봇 프로필, 대화 기록, 제목, 마지막 메시지 등을 통일된 형태로 반환
========================= */
const normalizeRoomItem = (room, index, mergedBots = [], fallbackBotKey = 'cat') => {
  const botKey = room?.botKey || fallbackBotKey;
  const botProfile = resolveBotProfile(botKey, mergedBots);

  const entries = normalizeChatEntries(
    room?.chatEntries || room?.chatLogs || room?.messages
  );
  const lastEntry = entries[entries.length - 1];

  return {
    id: room?.id ?? `${botKey}-${index}`,
    botKey,
    botProfile,
    title: resolveText(room?.title, room?.name) || `${botProfile.name}와의 대화`,
    lastMessage:
      resolveText(room?.lastMessage, room?.preview) ||
      lastEntry?.message ||
      '대화 내용이 없어요.',
    lastTime: resolveText(room?.lastTime, room?.time, lastEntry?.time),
    summary: room?.summary,
    overviewCards: room?.overviewCards,
    chatEntries: entries,
    noteCards: room?.noteCards || room?.notes,
    insight: room?.insight,
    botInterpretation: room?.botInterpretation,
  };
};

/* =========================
   날짜 기준 대화방 목록 정리
   - scopedData에서 chatRooms 배열을 찾아서 정리
   - 없으면 scopedData 자체를 하나의 대화방으로 변환
========================= */
const normalizeChatRooms = (scopedData, sourceData, mergedBots, fallbackBotKey) => {
  const raw = scopedData?.chatRooms || sourceData?.chatRooms || [];

  /* --- chatRooms 배열이 있으면 각각 정리해서 반환 --- */
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((room, index) =>
      normalizeRoomItem(room, index, mergedBots, fallbackBotKey)
    );
  }

  /* --- 없으면 scopedData를 하나의 대화방으로 변환 --- */
  const hasAnyData = Boolean(
    scopedData?.summary ||
      scopedData?.overviewCards ||
      scopedData?.chatEntries ||
      scopedData?.chatLogs ||
      scopedData?.noteCards ||
      scopedData?.notes ||
      scopedData?.insight ||
      scopedData?.botInterpretation
  );

  // 서버 데이터가 없으면 대화방도 만들지 않는다.
  if (!hasAnyData) return [];

  return [
    normalizeRoomItem(
      {
        id: scopedData?.id || 'default-room',
        botKey: scopedData?.botKey || fallbackBotKey,
        title: '대화방',
        lastMessage: resolveText(scopedData?.lastMessage, scopedData?.summary?.title),
        summary: scopedData?.summary,
        overviewCards: scopedData?.overviewCards,
        chatEntries: scopedData?.chatEntries || scopedData?.chatLogs,
        noteCards: scopedData?.noteCards || scopedData?.notes,
        insight: scopedData?.insight,
        botInterpretation: scopedData?.botInterpretation,
      },
      0,
      mergedBots,
      fallbackBotKey
    ),
  ];
};

/* =========================
   숫자 카운트업 애니메이션 컴포넌트
   - 0에서 목표 숫자까지 부드럽게 올라가는 효과
   - 하단 통계 카드에서 사용
========================= */
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

    /* --- 마운트 시에만 애니메이션하고 이후엔 바로 표시 --- */
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

/* =========================
   메인 컴포넌트
   - 날짜 선택(달력) → 대화방 선택 → 요약/메모/대화 흐름 → 통계 카드
========================= */
function ChatHistoryTab({
  data,
  selectedDate,
  onDateChange,
  selectedBotKey,
  botOptions = [],
  reportData,
  historyOverview,
}) {
  /* =========================
     사용할 원본 데이터 결정
  ========================= */
  const sourceData =
    data ||
    reportData?.chatHistoryTab ||
    {};

  /* =========================
     날짜 목록 정리
  ========================= */
  const dateOptions = useMemo(
    () => normalizeDateOptions(sourceData, historyOverview),
    [sourceData, historyOverview]
  );

  /* =========================
     현재 선택 날짜 계산
  ========================= */
  const currentDateKey = useMemo(() => {
    if (!dateOptions.length) return '';

    const matched = dateOptions.find(
      (item) =>
        item.key === selectedDate ||
        item.fullKey === selectedDate ||
        item.shortKey === selectedDate
    );

    return matched?.key || dateOptions[0].key;
  }, [selectedDate, dateOptions]);

  const currentDateOption =
    dateOptions.find(
      (item) =>
        item.key === currentDateKey ||
        item.fullKey === currentDateKey ||
        item.shortKey === currentDateKey
    ) || dateOptions[0];

  const currentDateLabel = currentDateOption?.label || currentDateKey;
  const anchorDate = currentDateOption?.date || new Date(CURRENT_YEAR, 3, 1);

  /* =========================
     달력 그리기용 데이터
  ========================= */
  const calendarMatrix = useMemo(
    () => buildCalendarMatrix(anchorDate),
    [anchorDate]
  );

  /* --- 기록이 있는 날짜를 빠르게 찾기 위한 Map --- */
  const selectableDateMap = useMemo(() => {
    const map = new Map();
    dateOptions.forEach((item) => {
      if (item.fullKey) map.set(item.fullKey, item);
    });
    return map;
  }, [dateOptions]);

  /* =========================
     현재 날짜에 해당하는 데이터 찾기
  ========================= */
  const scopedData = useMemo(
    () => resolveScopedData(sourceData, currentDateOption),
    [sourceData, currentDateOption]
  );

  /* =========================
     봇 목록 합치기
     - botOptions + reportData + sourceData + 기본값 순서로 합침
     - 같은 key가 있으면 먼저 나온 것이 우선
  ========================= */
  const mergedBots = useMemo(
    () => [
      ...(Array.isArray(botOptions) ? botOptions : []),
      ...(Array.isArray(reportData?.heroBots) ? reportData.heroBots : []),
      ...(Array.isArray(sourceData?.heroBots) ? sourceData.heroBots : []),
    ],
    [botOptions, reportData, sourceData]
  );

  /* =========================
     현재 날짜의 대화방 목록 정리
  ========================= */
  const chatRooms = useMemo(() => {
    const fallbackBotKey =
      scopedData?.botKey ||
      selectedBotKey ||
      '';

    return normalizeChatRooms(scopedData, sourceData, mergedBots, fallbackBotKey);
  }, [scopedData, sourceData, mergedBots, selectedBotKey]);

  /* =========================
     현재 선택된 대화방 id
     - 날짜가 바뀌면 첫 번째 대화방으로 초기화
  ========================= */
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

  /* =========================
     현재 선택된 대화방 데이터
  ========================= */
  const currentRoom =
    chatRooms.find((room) => room.id === selectedRoomId) || chatRooms[0] || null;

  const roomBot = currentRoom?.botProfile || null;

  /* --- 기본 하루치 대화방 (fallback용) --- */
  const defaultRoom = null;

  /* =========================
     요약 / 대화 / 메모 / 인사이트 / 봇 해석 / 통계 카드 정리
     - currentRoom에 있으면 사용, 없으면 scopedData, 없으면 기본값
  ========================= */
  const summary =
    currentRoom?.summary ||
    scopedData?.summary ||
    defaultRoom?.summary;

  const chatEntries = useMemo(() => {
    const raw =
      currentRoom?.chatEntries ||
      scopedData?.chatEntries ||
      scopedData?.chatLogs ||
      defaultRoom?.chatEntries;

    return normalizeChatEntries(raw);
  }, [currentRoom, scopedData]);

  const noteCards = useMemo(() => {
    const raw =
      currentRoom?.noteCards ||
      scopedData?.noteCards ||
      scopedData?.notes ||
      defaultRoom?.noteCards;

    if (!Array.isArray(raw) || raw.length === 0) {
      return [];
    }

    return raw.map((item, index) => ({
      id: item?.id ?? index,
      title: resolveText(item?.title, item?.label) || `메모 ${index + 1}`,
      description: resolveText(item?.description, item?.text, item?.content),
    }));
  }, [currentRoom, scopedData]);

  const insight =
    currentRoom?.insight ||
    scopedData?.insight ||
    defaultRoom?.insight;

  const botInterpretation =
    currentRoom?.botInterpretation ||
    scopedData?.botInterpretation ||
    defaultRoom?.botInterpretation;

  const overviewCards = useMemo(() => {
    const raw =
      currentRoom?.overviewCards ||
      scopedData?.overviewCards ||
      historyOverview?.overviewCards ||
      defaultRoom?.overviewCards;

    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((card, index) => ({
        id: card?.id ?? index,
        label: resolveText(card?.label, card?.title),
        value: resolveText(card?.value, card?.count),
        caption: resolveText(card?.caption, card?.description),
      }));
    }

    /* --- overviewCards가 없으면 현재 데이터로 자동 생성 --- */
    return [];
  }, [currentRoom, scopedData, historyOverview, chatEntries.length, noteCards.length, insight, summary]);

  /* =========================
     화면에서 바로 쓰기 좋게 2차 가공
  ========================= */
  const insightMeta = Array.isArray(insight?.meta) ? insight.meta : [];
  const summaryChips = Array.isArray(summary?.chips) ? summary.chips : [];
  const insightTags = Array.isArray(insight?.tags) ? insight.tags : [];
  const monthTitle = `${anchorDate.getFullYear()}년 ${anchorDate.getMonth() + 1}월`;

  /* --- 요약 칩 + 인사이트 태그를 합쳐서 중복 제거 (최대 5개) --- */
  const mergedTags = [...new Set([...summaryChips, ...insightTags])].slice(0, 5);

  /* --- 통계 카드 3개까지만 표시 --- */
  const compactOverviewCards = overviewCards.slice(0, 3);

  /* --- 봇 해석 포인트 3개까지만 --- */
  const interpretationBullets = Array.isArray(botInterpretation?.bullets)
    ? botInterpretation.bullets.slice(0, 3)
    : [];

  /* --- 인사이트 헤드라인/설명 (없으면 요약에서 가져옴) --- */
  const insightHeadline =
    insight?.headline ||
    summary?.title ||
    '이 날의 대화 흐름을 한눈에 정리했어요.';

  const insightDescription =
    insight?.description ||
    summary?.description ||
    botInterpretation?.summary ||
    '선택한 날짜의 감정 흐름과 핵심 포인트를 요약했어요.';

  /* =========================
     이벤트 함수
  ========================= */
  const handleDateSelect = (nextKey) => {
    onDateChange?.(nextKey);
  };

  const handleRoomSelect = (roomId) => {
    setSelectedRoomId(roomId);
  };

  /* =========================
     실제 화면 렌더링
  ========================= */
  // 기록이 없을 때는 더미/기본 UI를 보여주지 않는다.
  if (!dateOptions.length || !chatRooms.length) {
    return null;
  }

  return (
    <section className={styles.chatHistoryTab}>
      {/* =========================
          상단 영역
          - 왼쪽: 달력
          - 오른쪽: 대화방 목록
      ========================= */}
      <div
        className={`${styles.topBar} ${styles.panelEntrance}`}
        style={{ '--enter-delay': '40ms' }}
      >
        {/* ===== 달력 패널 ===== */}
        <div className={styles.calendarPanel}>
          <div className={styles.calendarHeader}>
            <div>
              <span className={styles.filterLabel}>날짜 선택</span>
              <h3 className={styles.calendarTitle}>{monthTitle}</h3>
              <p className={styles.calendarDescription}>
                기록이 있는 날짜를 선택하면 바로 아래에서 대화 흐름을 볼 수 있어요.
              </p>
            </div>

            <div className={styles.calendarSelectedBadge}>
              {currentDateLabel}
            </div>
          </div>

          {/* --- 요일 헤더 --- */}
          <div className={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((day) => (
              <div key={day} className={styles.weekdayCell}>
                {day}
              </div>
            ))}
          </div>

          {/* --- 달력 날짜 42칸 --- */}
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
                    isSelected && styles.dayCellSelected
                  )}
                >
                  <span className={styles.dayNumber}>{date.getDate()}</span>
                  {hasRecord ? <span className={styles.dayDot} /> : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== 대화방 목록 패널 ===== */}
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
                  {/* --- 봇 아바타 --- */}
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

                  {/* --- 대화방 정보 --- */}
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

      {/* =========================
          중간 본문 영역
          - 왼쪽: 요약 + 메모
          - 오른쪽: 대화 흐름
      ========================= */}
      <div className={styles.contentGrid}>
        {/* ===== 왼쪽 사이드 컬럼 ===== */}
        <div className={styles.sideColumn}>
          {/* --- 오늘의 요약 / 대화 해석 --- */}
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

            <strong className={styles.insightHeadline}>
              {insightHeadline}
            </strong>
            <p className={styles.insightDescription}>
              {insightDescription}
            </p>

            {/* --- 반복 패턴 / 회복 포인트 / 추천 포커스 --- */}
            {insightMeta.length > 0 && (
              <div className={styles.insightRow}>
                {insightMeta.slice(0, 3).map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    className={styles.insightBox}
                  >
                    <span className={styles.insightLabel}>{item.label}</span>
                    <strong className={styles.insightValue}>{item.value}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* --- 봇 해석 포인트 --- */}
            {interpretationBullets.length > 0 && (
              <div className={styles.compactBulletList}>
                {interpretationBullets.map((item) => (
                  <div key={item} className={styles.compactBulletItem}>
                    {item}
                  </div>
                ))}
              </div>
            )}

            {/* --- 태그 --- */}
            {mergedTags.length > 0 && (
              <div className={styles.tagRow}>
                {mergedTags.map((tag) => (
                  <span key={tag} className={styles.tagChip}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </article>

          {/* --- 메모 패널 --- */}
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
                    <p className={styles.memoDescription}>
                      {item.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  남아 있는 메모가 없어요.
                </div>
              )}
            </div>
          </article>
        </div>

        {/* ===== 오른쪽: 대화 흐름 타임라인 ===== */}
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
                const botAvatarSrc = isBot
                  ? resolveMascotImageSrcBySituationLabel(
                      entry.emotion,
                      roomBot?.key || currentRoom?.botKey || selectedBotKey || 'dog'
                    )
                  : null;

                return (
                  <div
                    key={entry.id}
                    className={cx(
                      styles.timelineItem,
                      isBot ? styles.timelineItemBot : styles.timelineItemMe
                    )}
                  >
                    {isBot ? (
                      <div className={styles.timelineRow}>
                        <span className={styles.timelineAvatarWrap} aria-hidden="true">
                          <img className={styles.timelineAvatar} src={botAvatarSrc} alt="" />
                        </span>

                        <div className={styles.timelineBody}>
                          <div className={styles.timelineMeta}>
                            <span
                              className={cx(
                                styles.speakerBadge,
                                styles.speakerBadgeBot
                              )}
                            >
                              BOT
                            </span>

                            {entry.emotion && (
                              <span className={styles.emotionBadge}>
                                {entry.emotion}
                              </span>
                            )}

                            <span className={styles.timeBadge}>{entry.time}</span>
                          </div>

                          <div
                            className={cx(
                              styles.bubble,
                              styles.bubbleBot
                            )}
                          >
                            {entry.message}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.timelineMeta}>
                          <span
                            className={cx(
                              styles.speakerBadge,
                              styles.speakerBadgeMe
                            )}
                          >
                            ME
                          </span>

                          {entry.emotion && (
                            <span className={styles.emotionBadge}>
                              {entry.emotion}
                            </span>
                          )}

                          <span className={styles.timeBadge}>{entry.time}</span>
                        </div>

                        <div
                          className={cx(
                            styles.bubble,
                            styles.bubbleMe
                          )}
                        >
                          {entry.message}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                아직 정리된 대화 기록이 없어요.
              </div>
            )}
          </div>
        </article>
      </div>

      {/* =========================
          하단 통계 카드
      ========================= */}
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
