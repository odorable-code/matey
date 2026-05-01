/**
 * [파일 역할]
 * - 감정 리포트 전체에서 반복 사용되는 "함수"를 한 곳에 모아둔 파일
 * - 날짜 파싱, key/label 추출, className 합치기 등
 *
 * [여기서 찾을 것]
 * - className 합치기: cx
 * - option에서 key 꺼내기: getOptionKey
 * - option에서 label 꺼내기: getOptionLabel
 * - 여러 문자열 중 첫 번째 유효한 값 찾기: resolveText
 * - 날짜 문자열을 Date로 변환: parseFlexibleDate
 * - Date를 문자열 key로 변환: formatFullDateKey, formatShortKey, formatMonthKey
 * - 두 날짜가 같은 날인지 비교: isSameDay
 * - 달력 42칸 배열 만들기: buildCalendarMatrix
 * - 숫자와 단위 분리: splitAnimatedValue
 * - 중복 없이 합치기: mergeUniqueByKey
 * - 히스토리 탭인지 판별: isHistoryTab
 *
 * [수정 포인트]
 * - 날짜 파싱 규칙 추가: parseFlexibleDate
 * - key 꺼내는 우선순위 변경: getOptionKey
 *
 * [주의]
 * - 이 파일은 "함수"만 있고, 상수/데이터는 없음
 * - 상수는 emotionReport.constants.js에 모아둠
 */

import { CURRENT_YEAR } from './emotionReport.constants';

/* =========================
   className 합칠 때 쓰는 함수
   - 사용 예시: cx(styles.card, isActive && styles.cardActive)
   - falsy 값(false, null, undefined, '')은 자동으로 빠짐
========================= */
export const cx = (...items) => items.filter(Boolean).join(' ');

/* =========================
   option 객체에서 key 값 꺼내기
   - { key: 'emotion' } → 'emotion'
   - key가 없으면 빈 문자열 반환
========================= */
export const getOptionKey = (item) => item?.key ?? '';

/* =========================
   option 객체에서 label 값 꺼내기
   - { label: '감정 리포트' } → '감정 리포트'
   - label이 없으면 빈 문자열 반환
========================= */
export const getOptionLabel = (item) => item?.label ?? '';

/* =========================
   여러 문자열 후보 중 첫 번째 유효한 값 찾기
   - 사용 예시: resolveText(entry?.time, entry?.timestamp, '--:--')
   - 빈 문자열('')은 건너뛰고, 실제 내용이 있는 첫 번째 값을 반환
========================= */
export const resolveText = (...values) =>
  values.find((value) => typeof value === 'string' && value.trim()) || '';

/* =========================
   날짜 문자열을 Date 객체로 변환하는 함수
   - 지원하는 형식:
     1. '2026-04-21' (연-월-일)
     2. '04-21' (월-일, CURRENT_YEAR 기준)
     3. '4월 21일' (한국어, CURRENT_YEAR 기준)
     4. 이미 Date 객체면 그대로 반환
   - 못 읽는 형식이면 null 반환
========================= */
export const parseFlexibleDate = (value) => {
  /* --- Date 객체가 들어온 경우 --- */
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  /* --- 문자열이 아니면 처리 불가 --- */
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  let match;

  /* --- 형식 1: '2026-04-21' --- */
  match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match.map(Number);
    return new Date(year, month - 1, day);
  }

  /* --- 형식 2: '04-21' --- */
  match = trimmed.match(/^(\d{2})-(\d{2})$/);
  if (match) {
    const [, month, day] = match.map(Number);
    return new Date(CURRENT_YEAR, month - 1, day);
  }

  /* --- 형식 3: '4월 21일' --- */
  match = trimmed.match(/^(\d{1,2})월\s*(\d{1,2})일$/);
  if (match) {
    const [, month, day] = match.map(Number);
    return new Date(CURRENT_YEAR, month - 1, day);
  }

  return null;
};

/* =========================
   Date → '2026-04-21' 형태 문자열
   - 전체 날짜 key가 필요할 때 사용
========================= */
export const formatFullDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
};

/* =========================
   Date → '04-21' 형태 문자열
   - 월-일만 필요할 때 사용
========================= */
export const formatShortKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${m}-${d}`;
};

/* =========================
   Date → '2026-04' 형태 문자열
   - 월 단위로 묶을 때 사용 (달력 제목 등)
========================= */
export const formatMonthKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/* =========================
   두 날짜가 같은 "날"인지 비교
   - 시간은 무시하고 년/월/일만 비교
========================= */
export const isSameDay = (a, b) =>
  a instanceof Date &&
  b instanceof Date &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* =========================
   달력에 표시할 42칸(6주) 날짜 배열 만들기
   - anchorDate가 속한 달의 1일부터 시작
   - 앞뒤로 빈 칸을 채워서 항상 42개(7 × 6)를 반환
   - 달력 UI 그릴 때 이 배열을 .map() 돌리면 됨
========================= */
export const buildCalendarMatrix = (anchorDate) => {
  /* --- 이번 달 1일 --- */
  const monthStart = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    1
  );

  /* --- 달력 시작점: 1일이 속한 주의 일요일 --- */
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  /* --- 42칸 채우기 --- */
  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    return current;
  });
};

/* =========================
   숫자와 단위를 분리하는 함수
   - '77%' → { numericValue: 77, suffix: '%', hasNumber: true }
   - '12회' → { numericValue: 12, suffix: '회', hasNumber: true }
   - '불안' → { numericValue: 0, suffix: '불안', hasNumber: false }
   - AnimatedValue 컴포넌트에서 사용
========================= */
export const splitAnimatedValue = (rawValue) => {
  const text = String(rawValue ?? '');
  const match = text.match(/^(-?\d+(?:\.\d+)?)(.*)$/);

  if (!match) {
    return { numericValue: 0, suffix: text, hasNumber: false };
  }

  return {
    numericValue: Number(match[1]) || 0,
    suffix: match[2] || '',
    hasNumber: true,
  };
};

/* =========================
   배열에서 key가 중복되는 항목을 제거
   - 먼저 나온 항목이 우선
   - 사용 예시: mergeUniqueByKey([...botOptions, ...FALLBACK_HERO_BOTS])
========================= */
export const mergeUniqueByKey = (items = []) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = getOptionKey(item);
    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

/* =========================
   현재 탭이 "대화 히스토리" 탭인지 판별
   - key 또는 label에 'history', '대화', '히스토리' 등이 포함되면 true
   - 감정 리포트 탭과 대화 히스토리 탭을 구분할 때 사용
========================= */
export const isHistoryTab = (tabKey, label) => {
  const raw = `${tabKey || ''} ${label || ''}`.toLowerCase();

  return (
    raw.includes('history') ||
    raw.includes('conversation') ||
    raw.includes('대화') ||
    raw.includes('히스토리')
  );
};
