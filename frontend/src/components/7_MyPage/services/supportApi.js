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
      source.support,
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

const SUPPORT_ENDPOINTS = [
  '/api/mypage/support',
  '/api/my-page/support',
  '/api/support',
  '/api/support/history',
  '/api/support/tickets',
  '/api/help/support',
];

const SUPPORT_CREATE_ENDPOINTS = [
  '/api/mypage/support',
  '/api/my-page/support',
  '/api/support',
  '/api/support/tickets',
  '/api/help/support',
];

const FAQ_ENDPOINTS = [
  '/api/mypage/support/faq',
  '/api/my-page/support/faq',
  '/api/support/faq',
  '/api/support/faqs',
  '/api/help/faq',
  '/api/help/faqs',
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

  throw lastError || new Error('지원 API 요청에 실패했습니다.');
};

const tryPost = async (endpoints, payload = {}) => {
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await requestJson(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('지원 등록 API 요청에 실패했습니다.');
};

export const getSupportHistory = async (params = {}) => {
  const response = await tryGet(SUPPORT_ENDPOINTS, params);

  return {
    ...response,
    support: pickFirst(response?.data?.support, response?.data, {}),
    items: pickFirst(
      response?.data?.items,
      response?.data?.history,
      response?.data?.tickets,
      response?.data?.supportHistory,
      []
    ),
  };
};

export const getMySupportHistory = async (params = {}) => getSupportHistory(params);
export const getSupport = async (params = {}) => getSupportHistory(params);
export const fetchSupportHistory = async (params = {}) => getSupportHistory(params);
export const fetchMySupportHistory = async (params = {}) => getSupportHistory(params);
export const fetchSupport = async (params = {}) => getSupportHistory(params);
export const requestSupportHistory = async (params = {}) => getSupportHistory(params);
export const requestSupport = async (params = {}) => getSupportHistory(params);
export const loadSupportHistory = async (params = {}) => getSupportHistory(params);
export const loadSupport = async (params = {}) => getSupportHistory(params);
export const getMySupportReports = async (params = {}) => getSupportHistory(params);

export const getFaqPreview = async (params = {}) => {
  const response = await tryGet(FAQ_ENDPOINTS, params);

  return {
    ...response,
    faq: pickFirst(
      response?.data?.faq,
      response?.data?.faqs,
      response?.data?.items,
      response?.data?.helpItems,
      []
    ),
  };
};

export const createSupportReport = async (payload = {}) => {
  const response = await tryPost(SUPPORT_CREATE_ENDPOINTS, payload);

  return {
    ...response,
    item: pickFirst(
      response?.data?.item,
      response?.data?.support,
      response?.data?.ticket,
      response?.data,
      {}
    ),
  };
};

export const createSupportTicket = async (payload = {}) => createSupportReport(payload);

export default {
  getSupportHistory,
  getMySupportHistory,
  getSupport,
  fetchSupportHistory,
  fetchMySupportHistory,
  fetchSupport,
  requestSupportHistory,
  requestSupport,
  loadSupportHistory,
  loadSupport,
  getMySupportReports,
  getFaqPreview,
  createSupportReport,
  createSupportTicket,
};
