import { useCallback, useEffect, useMemo, useState } from 'react';
import * as billingApi from '../services/billingApi';
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

const readLocalBilling = () => {
  if (typeof window === 'undefined') return {};

  const candidates = [
    'billingInfo',
    'billing',
    'paymentInfo',
    'subscriptionInfo',
    'myBilling',
  ];

  for (const key of candidates) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    const parsed = parseJson(raw);

    if (Array.isArray(parsed)) {
      return { payments: parsed };
    }

    if (isObject(parsed)) {
      return parsed;
    }
  }

  return {};
};

const getApiNamespaces = () => {
  const namespaces = [billingApi];

  if (isObject(billingApi?.default)) {
    namespaces.push(billingApi.default);
  }

  return namespaces.filter(Boolean);
};

const extractBillingPayload = (response) => {
  if (!response) return {};

  if (Array.isArray(response)) {
    return { payments: response };
  }

  if (!isObject(response)) {
    return {};
  }

  return safeObject(
    pickFirst(
      response.billing,
      response.data,
      response.result,
      response.payload,
      response
    ),
    {}
  );
};

const applyBillingMapper = (payload) => {
  const candidates = [
    mappers.mapBillingInfo,
    mappers.mapBilling,
    mappers.toBillingModel,
    mappers.normalizeBilling,
    mappers.mapPaymentSummary,
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

const normalizePaymentStatus = (value) => {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return '결제 완료';
  if (['paid', 'success', 'completed', 'done', 'approved'].includes(raw)) return '결제 완료';
  if (['pending', 'waiting', 'hold', 'review'].includes(raw)) return '대기중';
  if (['failed', 'cancelled', 'canceled', 'error'].includes(raw)) return '문제 발생';
  if (['scheduled', 'upcoming'].includes(raw)) return '예정';

  return value || '결제 완료';
};

const normalizePointType = (value, amount) => {
  const raw = String(value || '').trim().toLowerCase();

  if (['use', 'spend', 'used', 'expense', 'deduct'].includes(raw) || toNumber(amount, 0) < 0) {
    return 'use';
  }

  if (['expire', 'expired'].includes(raw)) {
    return 'expire';
  }

  return 'earn';
};

const normalizePayments = (source) => {
  const list = safeArray(source, []).map((item, index) => {
    const raw = safeObject(item, {});

    return {
      id: pickFirst(raw.id, raw.paymentId, raw.orderId, `payment-${index}`),
      title: pickFirst(
        raw.title,
        raw.name,
        raw.productName,
        raw.planName,
        '구독 결제'
      ),
      amount: toNumber(
        pickFirst(raw.amount, raw.price, raw.paidAmount, raw.totalAmount),
        0
      ),
      date: pickFirst(raw.date, raw.paidAt, raw.createdAt, raw.approvedAt, ''),
      method: pickFirst(raw.method, raw.paymentMethod, raw.cardName, '결제 수단'),
      status: normalizePaymentStatus(
        pickFirst(raw.status, raw.paymentStatus, '결제 완료')
      ),
      raw,
    };
  });

  if (list.length) return list;

  return [
    {
      id: 'payment-1',
      title: 'Premium Care 월 구독',
      amount: 12900,
      date: '',
      method: '정기결제',
      status: '결제 완료',
      raw: {},
    },
  ];
};

const normalizePointHistory = (source) => {
  const list = safeArray(source, []).map((item, index) => {
    const raw = safeObject(item, {});
    const amount = toNumber(
      pickFirst(raw.amount, raw.point, raw.points, raw.value),
      0
    );

    return {
      id: pickFirst(raw.id, raw.logId, raw.pointId, `point-${index}`),
      title: pickFirst(raw.title, raw.description, raw.reason, '포인트 내역'),
      amount,
      type: normalizePointType(
        pickFirst(raw.type, raw.action, raw.kind, ''),
        amount
      ),
      date: pickFirst(raw.date, raw.createdAt, raw.usedAt, ''),
      raw,
    };
  });

  if (list.length) return list;

  return [
    {
      id: 'point-1',
      title: '정기 구독 적립',
      amount: 300,
      type: 'earn',
      date: '',
      raw: {},
    },
    {
      id: 'point-2',
      title: '감정 리포트 사용',
      amount: -120,
      type: 'use',
      date: '',
      raw: {},
    },
  ];
};

const normalizeBilling = (payload) => {
  const mapped = applyBillingMapper(payload);

  const root = Array.isArray(mapped)
    ? { payments: mapped }
    : safeObject(mapped, safeObject(payload, {}));

  const payments = normalizePayments(
    pickFirst(
      root.payments,
      root.paymentHistory,
      root.billingHistory,
      root.orders,
      root.transactions,
      []
    )
  );

  const pointHistory = normalizePointHistory(
    pickFirst(
      root.pointHistory,
      root.pointsHistory,
      root.pointLogs,
      root.pointTransactions,
      []
    )
  );

  const availablePoints = toNumber(
    pickFirst(
      root.availablePoints,
      root.points,
      root.pointBalance,
      root.currentPoints,
      0
    ),
    0
  );

  const monthlyAmount = toNumber(
    pickFirst(
      root.monthlyAmount,
      root.price,
      root.subscription?.amount,
      root.plan?.price,
      payments[0]?.amount,
      12900
    ),
    12900
  );

  const subscriptionName = pickFirst(
    root.subscriptionName,
    root.planName,
    root.subscription?.name,
    root.plan?.name,
    'Premium Care'
  );

  const nextBillingDate = pickFirst(
    root.nextBillingDate,
    root.renewalDate,
    root.subscription?.nextBillingDate,
    ''
  );

  const paymentMethod = pickFirst(
    root.paymentMethod,
    root.defaultPaymentMethod,
    root.cardName,
    root.subscription?.paymentMethod,
    payments[0]?.method,
    '등록된 결제수단'
  );

  const totalPaid = payments.reduce((sum, item) => {
    if (normalizePaymentStatus(item.status) !== '결제 완료') return sum;
    return sum + toNumber(item.amount, 0);
  }, 0);

  return {
    subscriptionName,
    planName: subscriptionName,
    availablePoints,
    points: availablePoints,
    pointBalance: availablePoints,
    monthlyAmount,
    price: monthlyAmount,
    nextBillingDate,
    renewalDate: nextBillingDate,
    paymentMethod,
    defaultPaymentMethod: paymentMethod,
    cardName: paymentMethod,
    payments,
    paymentHistory: payments,
    billingHistory: payments,
    pointHistory,
    pointsHistory: pointHistory,
    pointLogs: pointHistory,
    totalPaid,
    raw: root,
  };
};

const callBillingApi = async () => {
  const namespaces = getApiNamespaces();
  const methodNames = [
    'getBillingInfo',
    'getMyBillingInfo',
    'getBilling',
    'fetchBillingInfo',
    'fetchMyBillingInfo',
    'fetchBilling',
    'requestBillingInfo',
    'requestBilling',
    'loadBillingInfo',
    'loadBilling',
  ];

  for (const namespace of namespaces) {
    for (const methodName of methodNames) {
      const fn = namespace?.[methodName];
      if (typeof fn !== 'function') continue;

      const response = await fn();
      const payload = extractBillingPayload(response);

      if (Array.isArray(payload)) {
        return { payments: payload };
      }

      if (isObject(payload) && Object.keys(payload).length > 0) {
        return payload;
      }
    }
  }

  return {};
};

function useBillingInfo(options = {}) {
  const {
    enabled = true,
    autoFetch = true,
    initialData = {},
  } = safeObject(options, {});

  const initialBilling = useMemo(() => {
    const source =
      (isObject(initialData) && Object.keys(initialData).length > 0) || Array.isArray(initialData)
        ? initialData
        : readLocalBilling();

    return normalizeBilling(source);
  }, [initialData]);

  const [billing, setBillingState] = useState(initialBilling);
  const [loading, setLoading] = useState(Boolean(enabled && autoFetch));
  const [error, setError] = useState('');

  const setBilling = useCallback((nextValue) => {
    setBillingState((prev) => {
      const resolved =
        typeof nextValue === 'function' ? nextValue(prev) : nextValue;

      return normalizeBilling(resolved);
    });
  }, []);

  const updateBilling = useCallback((updater) => {
    setBillingState((prev) => {
      const nextValue = typeof updater === 'function' ? updater(prev) : updater;

      if (Array.isArray(nextValue)) {
        return normalizeBilling({ ...safeObject(prev.raw, {}), payments: nextValue });
      }

      if (isObject(nextValue)) {
        return normalizeBilling({
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
      return billing;
    }

    setLoading(true);
    setError('');

    try {
      const remotePayload = await callBillingApi();
      const fallbackPayload =
        (isObject(remotePayload) && Object.keys(remotePayload).length > 0) ||
        (Array.isArray(remotePayload) && remotePayload.length > 0)
          ? remotePayload
          : readLocalBilling();

      const normalized = normalizeBilling(fallbackPayload);

      setBillingState(normalized);
      setLoading(false);

      return normalized;
    } catch (err) {
      const fallbackBilling = normalizeBilling(readLocalBilling());

      setBillingState((prev) =>
        Object.keys(fallbackBilling.raw || {}).length > 0 ? fallbackBilling : prev
      );
      setError(
        err instanceof Error
          ? err.message
          : '결제 정보를 불러오는 중 문제가 발생했습니다.'
      );
      setLoading(false);

      return fallbackBilling;
    }
  }, [enabled, billing]);

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
        const remotePayload = await callBillingApi();
        const fallbackPayload =
          (isObject(remotePayload) && Object.keys(remotePayload).length > 0) ||
          (Array.isArray(remotePayload) && remotePayload.length > 0)
            ? remotePayload
            : readLocalBilling();

        const normalized = normalizeBilling(fallbackPayload);

        if (!mounted) return;

        setBillingState(normalized);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;

        const fallbackBilling = normalizeBilling(readLocalBilling());

        setBillingState((prev) =>
          Object.keys(fallbackBilling.raw || {}).length > 0 ? fallbackBilling : prev
        );
        setError(
          err instanceof Error
            ? err.message
            : '결제 정보를 불러오는 중 문제가 발생했습니다.'
        );
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [enabled, autoFetch]);

  return {
    billing,
    data: billing,
    result: billing,
    payments: billing.payments,
    pointHistory: billing.pointHistory,
    availablePoints: billing.availablePoints,
    subscriptionName: billing.subscriptionName,
    loading,
    error,
    setBilling,
    updateBilling,
    refetch,
  };
}

export default useBillingInfo;
