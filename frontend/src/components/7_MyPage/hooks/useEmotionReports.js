import { useCallback, useEffect, useMemo, useState } from 'react';
import * as reportApi from '../services/reportApi';
import * as mappers from '../utils/mappers';

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isArray = Array.isArray;

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

const safeObject = (value, fallback = {}) => (isObject(value) ? value : fallback);
const safeArray = (value, fallback = []) => (isArray(value) ? value : fallback);

const parseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const DEFAULT_EMOTION_BARS = [
  { id: 'stable', label: '안정', value: 38, color: '#79aee8' },
  { id: 'fatigue', label: '피로', value: 22, color: '#8d80db' },
  { id: 'anxiety', label: '불안', value: 18, color: '#eb8db1' },
  { id: 'focus', label: '집중', value: 12, color: '#73c8b8' },
  { id: 'joy', label: '기쁨', value: 10, color: '#f3b183' },
];

const DEFAULT_WEEKLY_FLOW = [
  { id: 'mon', label: '월', value: 72 },
  { id: 'tue', label: '화', value: 68 },
  { id: 'wed', label: '수', value: 74 },
  { id: 'thu', label: '목', value: 79 },
  { id: 'fri', label: '금', value: 76 },
  { id: 'sat', label: '토', value: 82 },
  { id: 'sun', label: '일', value: 78 },
];

const DEFAULT_KEYWORDS = ['수면', '스트레스', '관계', '일상 루틴', '집중 회복'];

const normalizeEmotionLabel = (value) => {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return '안정';
  if (['stable', 'calm', 'neutral', 'steady', 'good'].includes(raw)) return '안정';
  if (['happy', 'joy', 'positive'].includes(raw)) return '기쁨';
  if (['anxious', 'anxiety', 'worry', 'stress', 'stressed'].includes(raw)) return '불안';
  if (['sad', 'down', 'depressed'].includes(raw)) return '침잠';
  if (['tired', 'fatigue', 'exhausted'].includes(raw)) return '피로';
  if (['focused', 'focus', 'motivated'].includes(raw)) return '집중';

  return value || '안정';
};

const readLocalReports = () => {
  if (typeof window === 'undefined') return {};

  const candidates = [
    'emotionReports',
    'reports',
    'emotionReport',
    'weeklyReport',
    'myReports',
  ];

  for (const key of candidates) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    const parsed = parseJson(raw);

    if (Array.isArray(parsed)) {
      return { emotionBars: parsed };
    }

    if (isObject(parsed)) {
      return parsed;
    }
  }

  return {};
};

const getApiNamespaces = () => {
  const namespaces = [reportApi];

  if (isObject(reportApi?.default)) {
    namespaces.push(reportApi.default);
  }

  return namespaces.filter(Boolean);
};

const extractReportPayload = (response) => {
  if (!response) return {};

  if (Array.isArray(response)) {
    return { emotionBars: response };
  }

  if (!isObject(response)) {
    return {};
  }

  return safeObject(
    pickFirst(
      response.reports,
      response.report,
      response.data,
      response.result,
      response.payload,
      response
    ),
    {}
  );
};

const applyReportMapper = (payload) => {
  const candidates = [
    mappers.mapEmotionReports,
    mappers.mapEmotionReport,
    mappers.mapReports,
    mappers.toEmotionReportModel,
    mappers.normalizeEmotionReports,
    mappers.normalizeReports,
  ].filter((fn) => typeof fn === 'function');

  if (!candidates.length) return safeObject(payload, {});

  for (const mapper of candidates) {
    try {
      const mapped = mapper(payload);
      if (isObject(mapped) || Array.isArray(mapped)) {
        return mapped;
      }
    } catch (error) {
      /* noop */
    }
  }

  return safeObject(payload, {});
};

const normalizeEmotionBars = (source) => {
  const list = safeArray(source, [])
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `emotion-${index}`,
          label: normalizeEmotionLabel(item),
          value: DEFAULT_EMOTION_BARS[index]?.value ?? 0,
          color: DEFAULT_EMOTION_BARS[index]?.color ?? '#8d80db',
        };
      }

      const raw = safeObject(item, {});

      return {
        id: pickFirst(raw.id, `emotion-${index}`),
        label: normalizeEmotionLabel(
          pickFirst(raw.label, raw.name, raw.emotion, `감정 ${index + 1}`)
        ),
        value: toNumber(
          pickFirst(raw.value, raw.percent, raw.percentage, raw.score),
          0
        ),
        color: pickFirst(raw.color, DEFAULT_EMOTION_BARS[index]?.color, '#8d80db'),
      };
    })
    .filter((item) => item.label);

  if (!list.length) return DEFAULT_EMOTION_BARS;

  const hasPositiveValue = list.some((item) => toNumber(item.value, 0) > 0);

  if (!hasPositiveValue) {
    return list.map((item, index) => ({
      ...item,
      value: DEFAULT_EMOTION_BARS[index]?.value ?? 10,
    }));
  }

  return list;
};

const normalizeWeeklyFlow = (source) => {
  const list = safeArray(source, [])
    .map((item, index) => {
      if (typeof item === 'number') {
        return {
          id: `day-${index}`,
          label: DEFAULT_WEEKLY_FLOW[index]?.label ?? `${index + 1}일`,
          value: toNumber(item, 0),
        };
      }

      if (typeof item === 'string') {
        return {
          id: `day-${index}`,
          label: item,
          value: DEFAULT_WEEKLY_FLOW[index]?.value ?? 70,
        };
      }

      const raw = safeObject(item, {});

      return {
        id: pickFirst(raw.id, `day-${index}`),
        label: pickFirst(raw.label, raw.day, raw.name, `${index + 1}일`),
        value: toNumber(
          pickFirst(raw.value, raw.score, raw.stability, raw.percent),
          0
        ),
      };
    })
    .filter((item) => item.label);

  if (!list.length) return DEFAULT_WEEKLY_FLOW;

  const hasPositiveValue = list.some((item) => toNumber(item.value, 0) > 0);

  if (!hasPositiveValue) return DEFAULT_WEEKLY_FLOW;

  return list;
};

const normalizeKeywords = (source) => {
  const list = safeArray(source, [])
    .map((item) => {
      if (typeof item === 'string') return item.trim();

      const raw = safeObject(item, {});
      return String(pickFirst(raw.label, raw.name, raw.keyword, '')).trim();
    })
    .filter(Boolean);

  return list.length ? [...new Set(list)].slice(0, 8) : DEFAULT_KEYWORDS;
};

const getDominantEmotion = (bars) => {
  const sorted = [...normalizeEmotionBars(bars)].sort(
    (a, b) => toNumber(b.value, 0) - toNumber(a.value, 0)
  );

  return sorted[0] || DEFAULT_EMOTION_BARS[0];
};

const normalizeReports = (payload) => {
  const mapped = applyReportMapper(payload);

  const root = Array.isArray(mapped)
    ? { emotionBars: mapped }
    : safeObject(mapped, safeObject(payload, {}));

  const emotionBars = normalizeEmotionBars(
    pickFirst(
      root.emotionBars,
      root.emotions,
      root.weeklyEmotions,
      root.chartData,
      root.distribution,
      []
    )
  );

  const weeklyFlow = normalizeWeeklyFlow(
    pickFirst(
      root.weeklyFlow,
      root.weeklyTrend,
      root.stabilityFlow,
      root.trendPoints,
      root.dailyScores,
      []
    )
  );

  const stability = toNumber(
    pickFirst(
      root.stability,
      root.stabilityScore,
      root.summary?.stability,
      root.summary?.stabilityScore,
      76
    ),
    76
  );

  const dominantEmotion =
    pickFirst(
      safeObject(root.dominantEmotion, {}).label
        ? safeObject(root.dominantEmotion, {})
        : null,
      null
    ) || getDominantEmotion(emotionBars);

  const keywords = normalizeKeywords(
    pickFirst(
      root.keywords,
      root.topKeywords,
      root.topics,
      root.summary?.keywords,
      []
    )
  );

  const rangeLabel = pickFirst(
    root.rangeLabel,
    root.periodLabel,
    root.reportPeriod,
    root.summary?.period,
    '최근 1주'
  );

  const updatedAt = pickFirst(root.updatedAt, root.createdAt, root.date, '');

  return {
    emotionBars,
    emotions: emotionBars,
    weeklyEmotions: emotionBars,
    chartData: emotionBars,
    weeklyFlow,
    weeklyTrend: weeklyFlow,
    trendPoints: weeklyFlow,
    stability,
    stabilityScore: stability,
    dominantEmotion: {
      ...dominantEmotion,
      label: normalizeEmotionLabel(dominantEmotion?.label),
      value: toNumber(dominantEmotion?.value, 0),
      color: pickFirst(dominantEmotion?.color, '#79aee8'),
    },
    keywords,
    topKeywords: keywords,
    topics: keywords,
    rangeLabel,
    periodLabel: rangeLabel,
    reportPeriod: rangeLabel,
    updatedAt,
    summary: {
      stability,
      stabilityScore: stability,
      dominantEmotion: normalizeEmotionLabel(dominantEmotion?.label),
      period: rangeLabel,
      keywords,
    },
    raw: root,
  };
};

const callReportApi = async () => {
  const namespaces = getApiNamespaces();
  const methodNames = [
    'getEmotionReports',
    'getEmotionReport',
    'getReports',
    'getReport',
    'fetchEmotionReports',
    'fetchEmotionReport',
    'fetchReports',
    'fetchReport',
    'requestEmotionReports',
    'requestEmotionReport',
    'loadEmotionReports',
    'loadEmotionReport',
  ];

  for (const namespace of namespaces) {
    for (const methodName of methodNames) {
      const fn = namespace?.[methodName];
      if (typeof fn !== 'function') continue;

      const response = await fn();
      const payload = extractReportPayload(response);

      if (Array.isArray(payload)) {
        return { emotionBars: payload };
      }

      if (isObject(payload) && Object.keys(payload).length > 0) {
        return payload;
      }
    }
  }

  return {};
};

function useEmotionReports(options = {}) {
  const {
    enabled = true,
    autoFetch = true,
    initialData = {},
  } = safeObject(options, {});

  const initialReports = useMemo(() => {
    const source =
      (isObject(initialData) && Object.keys(initialData).length > 0) || Array.isArray(initialData)
        ? initialData
        : readLocalReports();

    return normalizeReports(source);
  }, [initialData]);

  const [reports, setReportsState] = useState(initialReports);
  const [loading, setLoading] = useState(Boolean(enabled && autoFetch));
  const [error, setError] = useState('');

  const setReports = useCallback((nextValue) => {
    setReportsState((prev) => {
      const resolved =
        typeof nextValue === 'function' ? nextValue(prev) : nextValue;

      return normalizeReports(resolved);
    });
  }, []);

  const updateReports = useCallback((updater) => {
    setReportsState((prev) => {
      const nextValue = typeof updater === 'function' ? updater(prev) : updater;

      if (Array.isArray(nextValue)) {
        return normalizeReports({ ...safeObject(prev.raw, {}), emotionBars: nextValue });
      }

      if (isObject(nextValue)) {
        return normalizeReports({
          ...safeObject(prev.raw, {}),
          ...safeObject(prev, {}),
          ...nextValue,
        });
      }

      return prev;
    });
  }, []);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return reports;
    }

    setLoading(true);
    setError('');

    try {
      const remotePayload = await callReportApi();
      const fallbackPayload =
        (isObject(remotePayload) && Object.keys(remotePayload).length > 0) ||
        (Array.isArray(remotePayload) && remotePayload.length > 0)
          ? remotePayload
          : readLocalReports();

      const normalized = normalizeReports(fallbackPayload);

      setReportsState(normalized);
      setLoading(false);

      return normalized;
    } catch (err) {
      const fallbackReports = normalizeReports(readLocalReports());

      setReportsState((prev) =>
        (fallbackReports.emotionBars || []).length > 0 ? fallbackReports : prev
      );
      setError(
        err instanceof Error
          ? err.message
          : '감정 리포트를 불러오는 중 문제가 발생했습니다.'
      );
      setLoading(false);

      return fallbackReports;
    }
  }, [enabled, reports]);

  useEffect(() => {
    let mounted = true;

    if (!enabled || !autoFetch) {
      setLoading(false);
      return undefined;
    }

    (async () => {
      setLoading(true);
      setError('');

      try {
        const remotePayload = await callReportApi();
        const fallbackPayload =
          (isObject(remotePayload) && Object.keys(remotePayload).length > 0) ||
          (Array.isArray(remotePayload) && remotePayload.length > 0)
            ? remotePayload
            : readLocalReports();

        const normalized = normalizeReports(fallbackPayload);

        if (!mounted) return;

        setReportsState(normalized);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;

        const fallbackReports = normalizeReports(readLocalReports());

        setReportsState((prev) =>
          (fallbackReports.emotionBars || []).length > 0 ? fallbackReports : prev
        );
        setError(
          err instanceof Error
            ? err.message
            : '감정 리포트를 불러오는 중 문제가 발생했습니다.'
        );
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [enabled, autoFetch]);

  return {
    reports,
    report: reports,
    data: reports,
    result: reports,
    emotionBars: reports.emotionBars,
    weeklyFlow: reports.weeklyFlow,
    stability: reports.stability,
    dominantEmotion: reports.dominantEmotion,
    keywords: reports.keywords,
    loading,
    error,
    setReports,
    updateReports,
    refetch,
  };
}

export default useEmotionReports;
