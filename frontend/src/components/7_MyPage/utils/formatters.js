import {
  EMOTION_LABEL_MAP,
  PAYMENT_STATUS_LABELS,
  SUPPORT_STATUS_LABELS,
  EMOTION_COLOR_MAP,
} from './constants';

export const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

export const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const toStringSafe = (value, fallback = '') => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

export const trimString = (value, fallback = '') => {
  const text = toStringSafe(value, fallback);
  return text.trim();
};

export const formatNumber = (value, locale = 'ko-KR') =>
  new Intl.NumberFormat(locale).format(toNumber(value, 0));

export const formatPoints = (value, locale = 'ko-KR') =>
  `${formatNumber(value, locale)}P`;

export const formatCurrency = (
  value,
  {
    locale = 'ko-KR',
    currency = 'KRW',
    maximumFractionDigits = 0,
    fallback = '0원',
  } = {}
) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return fallback;
  }

  if (currency === 'KRW') {
    return `${new Intl.NumberFormat(locale, {
      maximumFractionDigits,
    }).format(amount)}원`;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(amount);
};

export const formatPercent = (value, digits = 0) => {
  const amount = toNumber(value, 0);
  return `${amount.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')}%`;
};

export const formatRatio = (value, total, digits = 0) => {
  const safeTotal = toNumber(total, 0);

  if (safeTotal <= 0) return formatPercent(0, digits);

  return formatPercent((toNumber(value, 0) / safeTotal) * 100, digits);
};

export const formatDate = (
  value,
  options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  },
  locale = 'ko-KR'
) => {
  if (!value) return '기록 없음';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(locale, options).format(date);
};

export const formatCompactDate = (
  value,
  options = {
    month: 'short',
    day: 'numeric',
  },
  locale = 'ko-KR'
) => {
  if (!value) return '정보 없음';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(locale, options).format(date);
};

export const formatDateTime = (
  value,
  options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  locale = 'ko-KR'
) => {
  if (!value) return '기록 없음';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(locale, options).format(date);
};

export const formatTime = (
  value,
  options = {
    hour: '2-digit',
    minute: '2-digit',
  },
  locale = 'ko-KR'
) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(locale, options).format(date);
};

export const formatDuration = (value) => {
  if (value === undefined || value === null || value === '') return '';

  if (typeof value === 'string' && Number.isNaN(Number(value))) {
    return value;
  }

  const totalMinutes = Math.max(0, Math.round(toNumber(value, 0)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}시간 ${minutes}분`;
  if (hours > 0) return `${hours}시간`;
  return `${minutes}분`;
};

export const normalizeEmotionLabel = (value) => {
  const raw = trimString(value).toLowerCase();

  if (!raw) return '안정';
  return EMOTION_LABEL_MAP[raw] || value || '안정';
};

export const normalizePaymentStatus = (value) => {
  const raw = trimString(value).toLowerCase();

  if (!raw) return '결제 완료';
  return PAYMENT_STATUS_LABELS[raw] || value || '결제 완료';
};

export const normalizeSupportStatus = (value) => {
  const raw = trimString(value).toLowerCase();

  if (!raw) return '접수 가능';
  return SUPPORT_STATUS_LABELS[raw] || value || '접수 가능';
};

export const getEmotionColor = (value, fallback = '#79aee8') => {
  const label = normalizeEmotionLabel(value);
  return EMOTION_COLOR_MAP[label] || fallback;
};

export const normalizeTags = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => trimString(item))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const uniqueTags = (value) => [...new Set(normalizeTags(value))];

export const getDisplayName = (profile = {}, fallback = 'Matey 사용자') =>
  pickFirst(
    profile?.nickname,
    profile?.displayName,
    profile?.name,
    profile?.userName,
    profile?.username,
    fallback
  );

export const getInitial = (value, fallback = 'M') => {
  const text = trimString(value);
  return text ? text.charAt(0).toUpperCase() : fallback;
};

export const getMoodBadgeTone = (value) => {
  const label = normalizeEmotionLabel(value);

  if (label === '불안') return 'alert';
  if (label === '기쁨') return 'warm';
  if (label === '집중') return 'mint';
  if (label === '피로' || label === '침잠') return 'muted';
  return 'calm';
};

export const getPaymentStatusTone = (value) => {
  const label = normalizePaymentStatus(value);

  if (label === '문제 발생') return 'alert';
  if (label === '대기중' || label === '예정') return 'warm';
  return 'mint';
};

export const getSupportStatusTone = (value) => {
  const label = normalizeSupportStatus(value);

  if (label === '해결됨' || label === '답변 완료') return 'mint';
  if (label === '검토중') return 'warm';
  return 'calm';
};

export const formatBooleanLabel = (value, trueLabel = '활성화', falseLabel = '비활성화') =>
  value ? trueLabel : falseLabel;

export const clamp = (value, min = 0, max = 100) =>
  Math.min(Math.max(toNumber(value, min), min), max);

export const sortByDateDesc = (list = [], key = 'date') =>
  [...list].sort(
    (a, b) => new Date(b?.[key] || 0).getTime() - new Date(a?.[key] || 0).getTime()
  );

export const sortByDateAsc = (list = [], key = 'date') =>
  [...list].sort(
    (a, b) => new Date(a?.[key] || 0).getTime() - new Date(b?.[key] || 0).getTime()
  );

export const sortByTitle = (list = [], key = 'title', locale = 'ko') =>
  [...list].sort((a, b) =>
    String(a?.[key] || '').localeCompare(String(b?.[key] || ''), locale)
  );

export default {
  isObject,
  pickFirst,
  toNumber,
  toStringSafe,
  trimString,
  formatNumber,
  formatPoints,
  formatCurrency,
  formatPercent,
  formatRatio,
  formatDate,
  formatCompactDate,
  formatDateTime,
  formatTime,
  formatDuration,
  normalizeEmotionLabel,
  normalizePaymentStatus,
  normalizeSupportStatus,
  getEmotionColor,
  normalizeTags,
  uniqueTags,
  getDisplayName,
  getInitial,
  getMoodBadgeTone,
  getPaymentStatusTone,
  getSupportStatusTone,
  formatBooleanLabel,
  clamp,
  sortByDateDesc,
  sortByDateAsc,
  sortByTitle,
};
