const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'
).replace(/\/$/, '');

const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
const TOKEN_KEY = 'matey_access_token';

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function buildHeaders(customHeaders = {}, isJson = true) {
  const headers = { ...customHeaders };
  const token = getStoredToken();

  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function request(
  path,
  {
    method = 'GET',
    body,
    headers = {},
    isJson = true,
    credentials = 'include',
  } = {}
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(headers, isJson),
    body:
      body === undefined || body === null
        ? undefined
        : isJson
        ? JSON.stringify(body)
        : body,
    credentials,
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text || null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data === 'string' ? data : null) ||
      '요청 처리 중 오류가 발생했어요.';
    throw new Error(message);
  }

  return data;
}

function normalizeToken(payload) {
  return (
    payload?.accessToken ||
    payload?.token ||
    payload?.data?.accessToken ||
    payload?.data?.token ||
    ''
  );
}

function normalizeUser(payload) {
  return payload?.user || payload?.data?.user || payload?.data || null;
}

export async function login({ email, password }) {
  const payload = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  const accessToken = normalizeToken(payload);
  const user = normalizeUser(payload);

  if (accessToken) {
    setStoredToken(accessToken);
  }

  return {
    raw: payload,
    accessToken,
    user,
    message: payload?.message || '로그인에 성공했어요.',
  };
}

export async function signup({ nickname, email, password }) {
  const payload = await request('/auth/signup', {
    method: 'POST',
    body: { nickname, email, password },
  });

  const accessToken = normalizeToken(payload);
  const user = normalizeUser(payload);

  if (accessToken) {
    setStoredToken(accessToken);
  }

  return {
    raw: payload,
    accessToken,
    user,
    message: payload?.message || '회원가입이 완료되었어요.',
  };
}

export async function getMyProfile() {
  const payload = await request('/auth/me', {
    method: 'GET',
  });

  return normalizeUser(payload) || payload;
}

export async function forgotPassword(email) {
  const payload = await request('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });

  return {
    raw: payload,
    message:
      payload?.message ||
      '비밀번호 재설정 링크를 이메일로 보냈어요. 메일함을 확인해 주세요.',
  };
}

export async function logout() {
  try {
    const payload = await request('/auth/logout', {
      method: 'POST',
      body: {},
    });

    setStoredToken(null);

    return {
      raw: payload,
      message: payload?.message || '로그아웃되었어요.',
    };
  } catch (error) {
    setStoredToken(null);
    throw error;
  }
}

export function getSocialLoginUrl(provider) {
  const providerKey = String(provider || '').toLowerCase();

  const customUrlMap = {
    google: process.env.REACT_APP_GOOGLE_AUTH_URL,
    kakao: process.env.REACT_APP_KAKAO_AUTH_URL,
    naver: process.env.REACT_APP_NAVER_AUTH_URL,
  };

  if (customUrlMap[providerKey]) {
    return customUrlMap[providerKey];
  }

  const defaultUrlMap = {
    google: `${BACKEND_BASE_URL}/oauth2/authorization/google`,
    kakao: `${BACKEND_BASE_URL}/oauth2/authorization/kakao`,
    naver: `${BACKEND_BASE_URL}/oauth2/authorization/naver`,
  };

  return defaultUrlMap[providerKey] || '';
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export { getStoredToken };
