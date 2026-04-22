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
      source.reports,
      source.report,
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

const REPORT_ENDPOINTS = [
  '/api/mypage/reports',
  '/api/my-page/reports',
  '/api/emotion/reports',
  '/api/emotion/report',
  '/api/reports/emotion',
  '/api/report/emotion',
  '/api/reports',
];

const REPORT_REFRESH_ENDPOINTS = [
  '/api/mypage/reports/refresh',
  '/api/my-page/reports/refresh',
  '/api/emotion/reports/refresh',
  '/api/report/emotion/refresh',
  '/api/reports/refresh',
];

const buildDetailEndpoints = (id) => {
  const safeId = encodeURIComponent(id);

  return [
    `/api/mypage/reports/${safeId}`,
    `/api/my-page/reports/${safeId}`,
    `/api/emotion/reports/${safeId}`,
    `/api/emotion/report/${safeId}`,
    `/api/reports/emotion/${safeId}`,
    `/api/report/emotion/${safeId}`,
    `/api/reports/${safeId}`,
    `/api/mypage/reports/detail/${safeId}`,
    `/api/reports/detail/${safeId}`,
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

      return {
        ...response,
        reports: pickFirst(response?.data?.reports, response?.data?.report, response?.data, {}),
        report: pickFirst(response?.data?.report, response?.data?.reports, response?.data, {}),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('감정 리포트 API 요청에 실패했습니다.');
};

const tryPost = async (endpoints, payload = {}) => {
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await requestJson(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        ...response,
        reports: pickFirst(response?.data?.reports, response?.data?.report, response?.data, {}),
        report: pickFirst(response?.data?.report, response?.data?.reports, response?.data, {}),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('감정 리포트 API 저장 요청에 실패했습니다.');
};

export const getEmotionReports = async (params = {}) => tryGet(REPORT_ENDPOINTS, params);
export const getEmotionReport = async (params = {}) => getEmotionReports(params);
export const getReports = async (params = {}) => getEmotionReports(params);
export const getReport = async (params = {}) => getEmotionReports(params);
export const fetchEmotionReports = async (params = {}) => getEmotionReports(params);
export const fetchEmotionReport = async (params = {}) => getEmotionReports(params);
export const fetchReports = async (params = {}) => getEmotionReports(params);
export const fetchReport = async (params = {}) => getEmotionReports(params);
export const requestEmotionReports = async (params = {}) => getEmotionReports(params);
export const requestEmotionReport = async (params = {}) => getEmotionReports(params);
export const loadEmotionReports = async (params = {}) => getEmotionReports(params);
export const loadEmotionReport = async (params = {}) => getEmotionReports(params);

export const getEmotionReportDetail = async (id) => {
  const response = await tryGet(buildDetailEndpoints(id));

  return {
    ...response,
    report: pickFirst(
      response?.data?.report,
      response?.data?.reports,
      response?.data?.item,
      response?.data,
      {}
    ),
  };
};

export const getReportDetail = async (id) => getEmotionReportDetail(id);
export const refreshEmotionReports = async (payload = {}) =>
  tryPost(REPORT_REFRESH_ENDPOINTS, payload);

export default {
  getEmotionReports,
  getEmotionReport,
  getReports,
  getReport,
  fetchEmotionReports,
  fetchEmotionReport,
  fetchReports,
  fetchReport,
  requestEmotionReports,
  requestEmotionReport,
  loadEmotionReports,
  loadEmotionReport,
  getEmotionReportDetail,
  getReportDetail,
  refreshEmotionReports,
};
