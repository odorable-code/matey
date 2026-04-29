/**
 * * 용도:
 * 1. 서비스('Matey')의 감정 분석 리포트와 관련된 모든 서버 통신(API 호출)을 전담하는 모듈입니다.
 * 2. JWT 토큰을 활용한 인증 헤더 설정 및 응답 데이터의 규격화(normalizeResponse)를 자동으로 처리합니다.
 * 3. 대시보드 요약 정보, 리포트 상세 내역, 리포트 갱신(Refresh) 등 다양한 엔드포인트를 통합 관리합니다.
 * 4. API 경로가 변경되거나 여러 후보군이 있을 경우를 대비하여 순차적 요청(tryGet, tryPost) 로직을 통해 통신 안정성을 확보합니다.
 * 5. 프론트엔드 컴포넌트에서 감정 데이터를 쉽고 일관되게 불러올 수 있도록 다양한 별칭(Alias) 함수들을 내보냅니다.
 * [파일 역할]
 * - 감정 리포트 관련 서버 요청을 모아둔 API 파일
 * - GET / POST 요청 공통 처리와 엔드포인트 후보 관리 담당
 *
 * [여기서 찾을 것]
 * - 토큰 붙이는 곳: buildHeaders
 * - fetch 공통 함수: requestJson
 * - 리포트 목록 조회: getEmotionReports
 * - 리포트 상세 조회: getEmotionReportDetail
 * - 리포트 새로고침/갱신: refreshEmotionReports
 *
 * [수정 포인트]
 * - API 주소 바꾸기: REPORT_ENDPOINTS, REPORT_REFRESH_ENDPOINTS, buildDetailEndpoints
 * - 응답 형태 바꾸기: normalizeResponse
 * - 에러 메시지 처리 바꾸기: requestJson
 *
 * [주의]
 * - 지금은 여러 백엔드 주소 형태를 다 대응하려고 조금 복잡한 편
 * - 나중에 백엔드 주소가 확정되면 endpoint와 alias를 많이 줄일 수 있음
 */

import { getStoredToken } from '../../../utils/api';

/* =========================
   값이 객체인지 확인하는 보조 함수
   - null, 배열은 제외
========================= */
const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/* =========================
   여러 값 중에서 가장 먼저 쓸 수 있는 값 하나 고르는 함수
   - undefined / null / '' 제외
========================= */
const pickFirst = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? '';

/* =========================
   공통 요청 헤더 만드는 코드
   - 토큰이 있으면 Authorization 자동 추가
   - 추가 헤더가 있으면 합쳐서 반환
========================= */
const buildHeaders = (extraHeaders = {}) => {
  const token = typeof getStoredToken === 'function' ? getStoredToken() : '';

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
};

/* =========================
   서버 응답 형태를 최대한 통일하는 코드
   - data / reports / report / result / payload 등
     여러 응답 키를 하나로 맞추기 위한 용도
========================= */
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

/* =========================
   fetch 공통 함수
   - 모든 JSON 요청은 여기로 들어온다고 생각하면 됨
   - 성공하면 normalizeResponse 반환
   - 실패하면 Error 발생
   *
   * [가장 많이 수정할 곳]
   * - credentials 정책
   * - 공통 헤더
   * - 에러 처리 방식
========================= */
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

/* =========================
   감정 리포트 목록 조회 API 후보 주소
   - 백엔드 주소가 하나로 확정되면 1개만 남겨도 됨
========================= */
const REPORT_ENDPOINTS = ['/api/report/emotion'];

/* =========================
   감정 리포트 갱신 API 후보 주소
========================= */
const REPORT_REFRESH_ENDPOINTS = ['/api/report/refresh'];

/* =========================
   상세 조회 주소 후보 만드는 코드
   - id를 붙여서 여러 형태의 주소를 시도
========================= */
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

/* =========================
   GET 요청 공통 함수
   - 여러 endpoint를 순서대로 시도
   - 성공하는 주소가 있으면 바로 반환
========================= */
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
        reports: pickFirst(
          response?.data?.reports,
          response?.data?.report,
          response?.data,
          {}
        ),
        report: pickFirst(
          response?.data?.report,
          response?.data?.reports,
          response?.data,
          {}
        ),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('감정 리포트 API 요청에 실패했습니다.');
};

/* =========================
   POST 요청 공통 함수
   - 여러 endpoint를 순서대로 시도
   - 성공하는 주소가 있으면 바로 반환
========================= */
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
        reports: pickFirst(
          response?.data?.reports,
          response?.data?.report,
          response?.data,
          {}
        ),
        report: pickFirst(
          response?.data?.report,
          response?.data?.reports,
          response?.data,
          {}
        ),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('감정 리포트 API 저장 요청에 실패했습니다.');
};

/* =========================
   외부에서 실제로 가져다 쓰는 함수들
   - 같은 기능 이름만 여러 방식으로 열어둔 상태
   - 나중에 프로젝트 정리할 때 하나로 통일 가능
========================= */
export const getEmotionReports = async (params = {}) => tryGet(REPORT_ENDPOINTS, params);
export const getEmotionReport = async (params = {}) => getEmotionReports(params);

/* =========================
   감정 리포트 상세 조회
   - report 하나를 가져오는 함수
========================= */
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

/* =========================
   감정 리포트 새로고침 / 재생성 요청
========================= */
export const refreshEmotionReports = async (payload = {}) =>
  tryPost(REPORT_REFRESH_ENDPOINTS, payload);

/* =========================
   default export
   - 객체 형태로 import해서 쓸 때 사용
========================= */
export default {
  getEmotionReports,
  getEmotionReport,
  getEmotionReportDetail,
  getReportDetail,
  refreshEmotionReports,
};
