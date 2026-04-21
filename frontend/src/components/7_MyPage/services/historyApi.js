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
      source.history,
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

const HISTORY_ENDPOINTS = [
  '/api/mypage/history',
  '/api/my-page/history',
  '/api/counsel/history',
  '/api/counseling/history',
  '/api/chat/history',
  '/api/sessions',
  '/api/session/history',
  '/api/history',
];

const buildDetailEndpoints = (id) => {
  const safeId = encodeURIComponent(id);

  return [
    `/api/mypage/history/${safeId}`,
    `/api/my-page/history/${safeId}`,
    `/api/counsel/history/${safeId}`,
    `/api/counseling/history/${safeId}`,
    `/api/chat/history/${safeId}`,
    `/api/sessions/${safeId}`,
    `/api/history/${safeId}`,
    `/api/mypage/history/detail/${safeId}`,
    `/api/history/detail/${safeId}`,
  ];
};

const tryGet = async (endpoints, params = {}) => {
  let lastError = null;
  const query = new URLSearchParams(params).toString();

  for (const endpoint of endpoints) {
    try {
      const response = await requestJson(query ? `${endpoint}?${query}` : endpoint, {
        method: 'GET',
      });

      const items = pickFirst(
        response?.data?.items,
        response?.data?.history,
        response?.data?.sessions,
        response?.data?.records,
        []
      );

      return {
        ...response,
        history: Array.isArray(items) ? items : [],
        items: Array.isArray(items) ? items : [],
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('상담내역 API 요청에 실패했습니다.');
};

export const getCounselHistory = async (params = {}) => tryGet(HISTORY_ENDPOINTS, params);
export const getMyCounselHistory = async (params = {}) => getCounselHistory(params);
export const getHistory = async (params = {}) => getCounselHistory(params);
export const fetchCounselHistory = async (params = {}) => getCounselHistory(params);
export const fetchHistory = async (params = {}) => getCounselHistory(params);
export const requestCounselHistory = async (params = {}) => getCounselHistory(params);
export const requestHistory = async (params = {}) => getCounselHistory(params);
export const loadCounselHistory = async (params = {}) => getCounselHistory(params);
export const loadHistory = async (params = {}) => getCounselHistory(params);

export const getCounselHistoryDetail = async (id) => {
  const response = await tryGet(buildDetailEndpoints(id));

  return {
    ...response,
    item: pickFirst(
      response?.data?.item,
      response?.data?.history,
      response?.data?.session,
      response?.data?.record,
      response?.data,
      {}
    ),
  };
};

export const getHistoryDetail = async (id) => getCounselHistoryDetail(id);

export default {
  getCounselHistory,
  getMyCounselHistory,
  getHistory,
  fetchCounselHistory,
  fetchHistory,
  requestCounselHistory,
  requestHistory,
  loadCounselHistory,
  loadHistory,
  getCounselHistoryDetail,
  getHistoryDetail,
};
