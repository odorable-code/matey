import { getStoredToken } from '../../../utils/api';

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

const buildHeaders = (extraHeaders = {}) => {
  const token = typeof getStoredToken === 'function' ? getStoredToken() : '';

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
};

const normalizeResponse = (response, status = 200) => {
  const source = isObject(response) ? response : {};

  return {
    success: pickFirst(source.success, true),
    status: pickFirst(source.status, status),
    message: pickFirst(source.message, ''),
    data: pickFirst(
      source.data,
      source.billing,
      source.payment,
      source.subscription,
      source.result,
      source.payload,
      source
    ),
  };
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: buildHeaders(options.headers),
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (isObject(payload) && pickFirst(payload.message, payload.error)) ||
      `요청에 실패했습니다. (${response.status})`;
    throw new Error(message);
  }

  return normalizeResponse(payload, response.status);
};

const BILLING_ENDPOINTS = [
  '/api/mypage/billing',
  '/api/my-page/billing',
  '/api/billing',
  '/api/billing/me',
  '/api/payment/billing',
  '/api/subscription',
  '/api/subscription/me',
];

const PAYMENT_HISTORY_ENDPOINTS = [
  '/api/mypage/billing/payments',
  '/api/my-page/billing/payments',
  '/api/billing/payments',
  '/api/payment/history',
  '/api/payments',
  '/api/orders',
];

const POINT_HISTORY_ENDPOINTS = [
  '/api/mypage/billing/points',
  '/api/my-page/billing/points',
  '/api/billing/points',
  '/api/points/history',
  '/api/point/history',
  '/api/points',
];

const tryGet = async (endpoints, params = {}) => {
  let lastError = null;
  const query = new URLSearchParams(params).toString();

  for (const endpoint of endpoints) {
    try {
      const response = await requestJson(query ? `${endpoint}?${query}` : endpoint, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('결제 API 요청에 실패했습니다.');
};

const tryWrite = async (method, endpoints, payload = {}) => {
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await requestJson(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('결제 API 저장 요청에 실패했습니다.');
};

export const getBillingInfo = async (params = {}) => {
  const response = await tryGet(BILLING_ENDPOINTS, params);

  return {
    ...response,
    billing: pickFirst(
      response?.data?.billing,
      response?.data?.subscription,
      response?.data,
      {}
    ),
  };
};

export const getMyBillingInfo = async (params = {}) => getBillingInfo(params);
export const getBilling = async (params = {}) => getBillingInfo(params);
export const fetchBillingInfo = async (params = {}) => getBillingInfo(params);
export const fetchMyBillingInfo = async (params = {}) => getBillingInfo(params);
export const fetchBilling = async (params = {}) => getBillingInfo(params);
export const requestBillingInfo = async (params = {}) => getBillingInfo(params);
export const requestBilling = async (params = {}) => getBillingInfo(params);
export const loadBillingInfo = async (params = {}) => getBillingInfo(params);
export const loadBilling = async (params = {}) => getBillingInfo(params);

export const getPaymentHistory = async (params = {}) => {
  const response = await tryGet(PAYMENT_HISTORY_ENDPOINTS, params);

  return {
    ...response,
    payments: pickFirst(
      response?.data?.payments,
      response?.data?.items,
      response?.data?.orders,
      [],
    ),
  };
};

export const getPointHistory = async (params = {}) => {
  const response = await tryGet(POINT_HISTORY_ENDPOINTS, params);

  return {
    ...response,
    pointHistory: pickFirst(
      response?.data?.pointHistory,
      response?.data?.pointsHistory,
      response?.data?.pointLogs,
      response?.data?.items,
      [],
    ),
  };
};

export const updateBillingInfo = async (payload = {}) =>
  tryWrite('PUT', BILLING_ENDPOINTS, payload);

export const patchBillingInfo = async (payload = {}) =>
  tryWrite('PATCH', BILLING_ENDPOINTS, payload);

export default {
  getBillingInfo,
  getMyBillingInfo,
  getBilling,
  fetchBillingInfo,
  fetchMyBillingInfo,
  fetchBilling,
  requestBillingInfo,
  requestBilling,
  loadBillingInfo,
  loadBilling,
  getPaymentHistory,
  getPointHistory,
  updateBillingInfo,
  patchBillingInfo,
};
