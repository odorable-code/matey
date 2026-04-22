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
      source.profile,
      source.user,
      source.member,
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

const PROFILE_ENDPOINTS = [
  '/api/mypage/profile',
  '/api/my-page/profile',
  '/api/profile/me',
  '/api/users/me',
  '/api/user/me',
  '/api/member/me',
  '/api/members/me',
];

const tryGet = async (endpoints) => {
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await requestJson(endpoint, { method: 'GET' });
      return {
        ...response,
        profile: pickFirst(
          response?.data?.profile,
          response?.data?.user,
          response?.data?.member,
          response?.data,
          {}
        ),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('프로필 API 요청에 실패했습니다.');
};

const tryWrite = async (method, endpoints, payload = {}) => {
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await requestJson(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      return {
        ...response,
        profile: pickFirst(
          response?.data?.profile,
          response?.data?.user,
          response?.data?.member,
          response?.data,
          {}
        ),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('프로필 저장 API 요청에 실패했습니다.');
};

export const getMyProfile = async () => tryGet(PROFILE_ENDPOINTS);
export const getProfile = async () => getMyProfile();
export const fetchMyProfile = async () => getMyProfile();
export const fetchProfile = async () => getMyProfile();
export const requestMyProfile = async () => getMyProfile();
export const requestProfile = async () => getMyProfile();
export const loadMyProfile = async () => getMyProfile();
export const loadProfile = async () => getMyProfile();

export const updateMyProfile = async (payload = {}) =>
  tryWrite('PUT', PROFILE_ENDPOINTS, payload);

export const patchMyProfile = async (payload = {}) =>
  tryWrite('PATCH', PROFILE_ENDPOINTS, payload);

export default {
  getMyProfile,
  getProfile,
  fetchMyProfile,
  fetchProfile,
  requestMyProfile,
  requestProfile,
  loadMyProfile,
  loadProfile,
  updateMyProfile,
  patchMyProfile,
};
