import { useCallback, useEffect, useMemo, useState } from 'react';
import * as historyApi from '../services/historyApi';
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

const normalizeMood = (value) => {
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

const ensureTags = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const readLocalHistory = () => {
  if (typeof window === 'undefined') return {};

  const candidates = [
    'counselHistory',
    'history',
    'chatHistory',
    'myHistory',
    'sessionHistory',
  ];

  for (const key of candidates) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    const parsed = parseJson(raw);

    if (Array.isArray(parsed)) {
      return { items: parsed };
    }

    if (isObject(parsed)) {
      return parsed;
    }
  }

  return {};
};

const getApiNamespaces = () => {
  const namespaces = [historyApi];

  if (isObject(historyApi?.default)) {
    namespaces.push(historyApi.default);
  }

  return namespaces.filter(Boolean);
};

const extractHistoryPayload = (response) => {
  if (!response) return {};

  if (Array.isArray(response)) {
    return { items: response };
  }

  if (!isObject(response)) {
    return {};
  }

  return safeObject(
    pickFirst(
      response.history,
      response.data,
      response.result,
      response.payload,
      response
    ),
    {}
  );
};

const applyHistoryMapper = (payload) => {
  const candidates = [
    mappers.mapCounselHistory,
    mappers.mapHistory,
    mappers.toHistoryModel,
    mappers.normalizeHistory,
    mappers.mapCounselHistoryList,
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

const normalizeHistoryItem = (item, index = 0) => {
  const raw = safeObject(item, {});

  return {
    id: pickFirst(raw.id, raw.sessionId, raw.counselId, raw.chatId, `history-${index}`),
    title: pickFirst(raw.title, raw.topic, raw.subject, raw.sessionTitle, '상담 기록'),
    summary: pickFirst(
      raw.summary,
      raw.preview,
      raw.description,
      raw.lastMessage,
      raw.contentPreview,
      '최근 상담 내용이 여기에 표시됩니다.'
    ),
    mood: normalizeMood(pickFirst(raw.mood, raw.emotion, raw.statusLabel, raw.feeling, '안정')),
    date: pickFirst(raw.date, raw.createdAt, raw.startedAt, raw.time, raw.updatedAt, ''),
    createdAt: pickFirst(raw.createdAt, raw.date, raw.startedAt, raw.time, ''),
    updatedAt: pickFirst(raw.updatedAt, raw.date, raw.createdAt, ''),
    counselor: pickFirst(raw.botName, raw.assistantName, raw.counselor, raw.bot, 'Matey AI'),
    duration: pickFirst(raw.duration, raw.durationText, raw.durationLabel, ''),
    tags: [
      ...new Set(
        [
          ...ensureTags(pickFirst(raw.tags, raw.keywords, raw.topics, raw.topicTags, [])),
          pickFirst(raw.topic, raw.subject, ''),
          normalizeMood(pickFirst(raw.mood, raw.emotion, '')),
        ].filter(Boolean)
      ),
    ],
    raw,
  };
};

const normalizeHistory = (payload) => {
  const mapped = applyHistoryMapper(payload);

  const root = Array.isArray(mapped)
    ? { items: mapped }
    : safeObject(mapped, safeObject(payload, {}));

  const itemsSource = safeArray(
    pickFirst(
      root.items,
      root.history,
      root.sessions,
      root.list,
      root.records,
      root.content,
      []
    ),
    []
  );

  const items = itemsSource.map((item, index) => normalizeHistoryItem(item, index));

  const totalCount = toNumber(
    pickFirst(
      root.totalCount,
      root.total,
      root.count,
      root.size,
      items.length
    ),
    items.length
  );

  return {
    items,
    history: items,
    sessions: items,
    totalCount,
    total: totalCount,
    count: totalCount,
    latestItem: items[0] || null,
    raw: root,
  };
};

const callHistoryApi = async () => {
  const namespaces = getApiNamespaces();
  const methodNames = [
    'getCounselHistory',
    'getMyCounselHistory',
    'getHistory',
    'fetchCounselHistory',
    'fetchHistory',
    'requestCounselHistory',
    'requestHistory',
    'loadCounselHistory',
    'loadHistory',
  ];

  for (const namespace of namespaces) {
    for (const methodName of methodNames) {
      const fn = namespace?.[methodName];
      if (typeof fn !== 'function') continue;

      const response = await fn();
      const payload = extractHistoryPayload(response);

      if (Array.isArray(payload)) {
        return { items: payload };
      }

      if (isObject(payload) && Object.keys(payload).length > 0) {
        return payload;
      }
    }
  }

  return {};
};

function useCounselHistory(options = {}) {
  const {
    enabled = true,
    autoFetch = true,
    initialData = {},
  } = safeObject(options, {});

  const initialHistory = useMemo(() => {
    const source =
      (isObject(initialData) && Object.keys(initialData).length > 0) || Array.isArray(initialData)
        ? initialData
        : readLocalHistory();

    return normalizeHistory(source);
  }, [initialData]);

  const [history, setHistoryState] = useState(initialHistory);
  const [loading, setLoading] = useState(Boolean(enabled && autoFetch));
  const [error, setError] = useState('');

  const setHistory = useCallback((nextValue) => {
    setHistoryState((prev) => {
      const resolved =
        typeof nextValue === 'function' ? nextValue(prev) : nextValue;

      return normalizeHistory(resolved);
    });
  }, []);

  const updateHistory = useCallback((updater) => {
    setHistoryState((prev) => {
      const nextValue = typeof updater === 'function' ? updater(prev) : updater;

      if (Array.isArray(nextValue)) {
        return normalizeHistory({ ...safeObject(prev.raw, {}), items: nextValue });
      }

      if (isObject(nextValue)) {
        return normalizeHistory({
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
      return history;
    }

    setLoading(true);
    setError('');

    try {
      const remotePayload = await callHistoryApi();
      const fallbackPayload =
        (isObject(remotePayload) && Object.keys(remotePayload).length > 0) ||
        (Array.isArray(remotePayload) && remotePayload.length > 0)
          ? remotePayload
          : readLocalHistory();

      const normalized = normalizeHistory(fallbackPayload);

      setHistoryState(normalized);
      setLoading(false);

      return normalized;
    } catch (err) {
      const fallbackHistory = normalizeHistory(readLocalHistory());

      setHistoryState((prev) =>
        (fallbackHistory.items || []).length > 0 ? fallbackHistory : prev
      );
      setError(
        err instanceof Error
          ? err.message
          : '상담내역을 불러오는 중 문제가 발생했습니다.'
      );
      setLoading(false);

      return fallbackHistory;
    }
  }, [enabled, history]);

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
        const remotePayload = await callHistoryApi();
        const fallbackPayload =
          (isObject(remotePayload) && Object.keys(remotePayload).length > 0) ||
          (Array.isArray(remotePayload) && remotePayload.length > 0)
            ? remotePayload
            : readLocalHistory();

        const normalized = normalizeHistory(fallbackPayload);

        if (!mounted) return;

        setHistoryState(normalized);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;

        const fallbackHistory = normalizeHistory(readLocalHistory());

        setHistoryState((prev) =>
          (fallbackHistory.items || []).length > 0 ? fallbackHistory : prev
        );
        setError(
          err instanceof Error
            ? err.message
            : '상담내역을 불러오는 중 문제가 발생했습니다.'
        );
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [enabled, autoFetch]);

  return {
    history,
    data: history,
    result: history,
    items: history.items,
    sessions: history.items,
    totalCount: history.totalCount,
    loading,
    error,
    setHistory,
    updateHistory,
    refetch,
  };
}

export default useCounselHistory;
