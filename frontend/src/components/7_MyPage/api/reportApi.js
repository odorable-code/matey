/**
 * * 용도:
 * 1. 서비스('Matey'/'Huggy')의 감정 분석 리포트와 관련된 모든 서버 통신(API 호출)을 전담하는 모듈입니다.
 * 2. JWT 토큰을 활용한 인증 헤더 설정 및 응답 데이터의 규격화(normalizeResponse)를 자동으로 처리합니다.
 * 3. 대시보드 요약 정보, 리포트 상세 내역, 리포트 갱신(Refresh) 등 다양한 엔드포인트를 통합 관리합니다.
 * 4. API 경로가 변경되거나 여러 후보군이 있을 경우를 대비하여 순차적 요청(tryGet, tryPost) 로직을 통해 통신 안정성을 확보합니다.
 * 5. 프론트엔드 컴포넌트에서 감정 데이터를 쉽고 일관되게 불러올 수 있도록 다양한 별칭(Alias) 함수들을 내보냅니다.
 */

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
  '/api/emotion-report/dashboard',
];

const REPORT_REFRESH_ENDPOINTS = [
  '/api/report/refresh',
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
  getEmotionReportDetail,
  getReportDetail,
  refreshEmotionReports,
};
