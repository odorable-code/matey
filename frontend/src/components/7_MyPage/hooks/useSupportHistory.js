import { useCallback, useEffect, useMemo, useState } from 'react';
import * as supportApi from '../services/supportApi';
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

const normalizeStatus = (value) => {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return '접수 가능';
  if (['open', 'received', 'submitted', 'new', 'created'].includes(raw)) return '접수됨';
  if (['pending', 'waiting', 'review', 'in_review', 'processing'].includes(raw)) return '검토중';
  if (['resolved', 'done', 'complete', 'completed', 'closed'].includes(raw)) return '해결됨';
  if (['reply', 'answered', 'replied'].includes(raw)) return '답변 완료';

  return value || '접수 가능';
};

const readLocalSupport = () => {
  if (typeof window === 'undefined') return {};

  const candidates = [
    'supportHistory',
    'support',
    'supportTickets',
    'helpHistory',
    'mySupport',
    'faqPreview',
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
  const namespaces = [supportApi];

  if (isObject(supportApi?.default)) {
    namespaces.push(supportApi.default);
  }

  return namespaces.filter(Boolean);
};

const extractSupportPayload = (response) => {
  if (!response) return {};

  if (Array.isArray(response)) {
    return { items: response };
  }

  if (!isObject(response)) {
    return {};
  }

  return safeObject(
    pickFirst(
      response.support,
      response.data,
      response.result,
      response.payload,
      response
    ),
    {}
  );
};

const applySupportMapper = (payload) => {
  const candidates = [
    mappers.mapSupportHistory,
    mappers.mapSupport,
    mappers.mapSupportItems,
    mappers.toSupportModel,
    mappers.normalizeSupport,
    mappers.normalizeSupportHistory,
    mappers.mapFaqPreview,
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

const normalizeSupportItem = (item, index = 0) => {
  const raw = safeObject(item, {});

  return {
    id: pickFirst(raw.id, raw.ticketId, raw.supportId, `support-${index}`),
    title: pickFirst(raw.title, raw.subject, raw.name, '문의 내역'),
    content: pickFirst(
      raw.content,
      raw.description,
      raw.message,
      raw.summary,
      '문의 내용이 여기에 표시됩니다.'
    ),
    status: normalizeStatus(
      pickFirst(raw.status, raw.state, raw.ticketStatus, '접수됨')
    ),
    date: pickFirst(raw.createdAt, raw.updatedAt, raw.date, ''),
    createdAt: pickFirst(raw.createdAt, raw.date, raw.updatedAt, ''),
    updatedAt: pickFirst(raw.updatedAt, raw.createdAt, raw.date, ''),
    category: pickFirst(raw.category, raw.type, '일반 문의'),
    raw,
  };
};

const normalizeFaqItem = (item, index = 0) => {
  if (typeof item === 'string') {
    return {
      id: `faq-${index}`,
      question: item,
      answer: '자세한 내용은 지원 센터에서 확인할 수 있어요.',
      raw: { question: item },
    };
  }

  const raw = safeObject(item, {});

  return {
    id: pickFirst(raw.id, `faq-${index}`),
    question: pickFirst(raw.question, raw.title, raw.name, ''),
    answer: pickFirst(
      raw.answer,
      raw.description,
      raw.content,
      '자세한 내용은 지원 센터에서 확인할 수 있어요.'
    ),
    raw,
  };
};

const normalizeSupport = (payload) => {
  const mapped = applySupportMapper(payload);

  const root = Array.isArray(mapped)
    ? { items: mapped }
    : safeObject(mapped, safeObject(payload, {}));

  const items = safeArray(
    pickFirst(
      root.items,
      root.history,
      root.tickets,
      root.supportHistory,
      root.list,
      root.data,
      []
    ),
    []
  ).map((item, index) => normalizeSupportItem(item, index));

  const faq = safeArray(
    pickFirst(
      root.faq,
      root.faqs,
      root.faqPreview,
      root.helpItems,
      root.knowledgeBase,
      []
    ),
    []
  )
    .map((item, index) => normalizeFaqItem(item, index))
    .filter((item) => item.question);

  const totalCount = toNumber(
    pickFirst(root.totalCount, root.count, root.total, items.length),
    items.length
  );

  const latestStatus = pickFirst(items[0]?.status, root.latestStatus, '접수 가능');

  return {
    items,
    history: items,
    tickets: items,
    supportHistory: items,
    faq,
    faqs: faq,
    faqPreview: faq,
    totalCount,
    total: totalCount,
    count: totalCount,
    latestStatus,
    raw: root,
  };
};

const callSupportApi = async () => {
  const namespaces = getApiNamespaces();
  const methodNames = [
    'getSupportHistory',
    'getMySupportHistory',
    'getSupport',
    'getMySupportReports',
    'fetchSupportHistory',
    'fetchMySupportHistory',
    'fetchSupport',
    'requestSupportHistory',
    'requestSupport',
    'loadSupportHistory',
    'loadSupport',
  ];

  for (const namespace of namespaces) {
    for (const methodName of methodNames) {
      const fn = namespace?.[methodName];
      if (typeof fn !== 'function') continue;

      const response = await fn();
      const payload = extractSupportPayload(response);

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

function useSupportHistory(options = {}) {
  const {
    enabled = true,
    autoFetch = true,
    initialData = {},
  } = safeObject(options, {});

  const initialSupport = useMemo(() => {
    const source =
      (isObject(initialData) && Object.keys(initialData).length > 0) || Array.isArray(initialData)
        ? initialData
        : readLocalSupport();

    return normalizeSupport(source);
  }, [initialData]);

  const [support, setSupportState] = useState(initialSupport);
  const [loading, setLoading] = useState(Boolean(enabled && autoFetch));
  const [error, setError] = useState('');

  const setSupport = useCallback((nextValue) => {
    setSupportState((prev) => {
      const resolved =
        typeof nextValue === 'function' ? nextValue(prev) : nextValue;

      return normalizeSupport(resolved);
    });
  }, []);

  const updateSupport = useCallback((updater) => {
    setSupportState((prev) => {
      const nextValue = typeof updater === 'function' ? updater(prev) : updater;

      if (Array.isArray(nextValue)) {
        return normalizeSupport({ ...safeObject(prev.raw, {}), items: nextValue });
      }

      if (isObject(nextValue)) {
        return normalizeSupport({
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
      return support;
    }

    setLoading(true);
    setError('');

    try {
      const remotePayload = await callSupportApi();
      const fallbackPayload =
        (isObject(remotePayload) && Object.keys(remotePayload).length > 0) ||
        (Array.isArray(remotePayload) && remotePayload.length > 0)
          ? remotePayload
          : readLocalSupport();

      const normalized = normalizeSupport(fallbackPayload);

      setSupportState(normalized);
      setLoading(false);

      return normalized;
    } catch (err) {
      const fallbackSupport = normalizeSupport(readLocalSupport());

      setSupportState((prev) =>
        Object.keys(fallbackSupport.raw || {}).length > 0 ? fallbackSupport : prev
      );
      setError(
        err instanceof Error
          ? err.message
          : '지원 정보를 불러오는 중 문제가 발생했습니다.'
      );
      setLoading(false);

      return fallbackSupport;
    }
  }, [enabled, support]);

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
        const remotePayload = await callSupportApi();
        const fallbackPayload =
          (isObject(remotePayload) && Object.keys(remotePayload).length > 0) ||
          (Array.isArray(remotePayload) && remotePayload.length > 0)
            ? remotePayload
            : readLocalSupport();

        const normalized = normalizeSupport(fallbackPayload);

        if (!mounted) return;

        setSupportState(normalized);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;

        const fallbackSupport = normalizeSupport(readLocalSupport());

        setSupportState((prev) =>
          Object.keys(fallbackSupport.raw || {}).length > 0 ? fallbackSupport : prev
        );
        setError(
          err instanceof Error
            ? err.message
            : '지원 정보를 불러오는 중 문제가 발생했습니다.'
        );
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [enabled, autoFetch]);

  return {
    support,
    data: support,
    result: support,
    items: support.items,
    history: support.items,
    tickets: support.items,
    faq: support.faq,
    faqs: support.faq,
    totalCount: support.totalCount,
    latestStatus: support.latestStatus,
    loading,
    error,
    setSupport,
    updateSupport,
    refetch,
  };
}

export default useSupportHistory;
