import { getStoredToken } from '../../../utils/api';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, item);
        }
      });
      return;
    }

    searchParams.append(key, value);
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

function buildUrl(path, params = {}) {
  return `${API_BASE_URL}${path}${buildQueryString(params)}`;
}

async function parseResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  try {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch (error) {
      return text;
    }
  } catch (error) {
    return null;
  }
}

export function normalizeRequestError(error, fallbackMessage = '요청 처리 중 오류가 발생했어요.') {
  if (error?.status || error?.message) {
    return {
      status: error.status || 0,
      message: error.message || fallbackMessage,
      raw: error.raw || error,
      data: error.data || null,
    };
  }

  return {
    status: 0,
    message: fallbackMessage,
    raw: error,
    data: null,
  };
}

export async function request(path, options = {}) {
  const {
    method = 'GET',
    params = {},
    body,
    headers = {},
    withAuth = true,
  } = options;

  const token = withAuth && typeof getStoredToken === 'function'
    ? getStoredToken()
    : null;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const requestHeaders = {
    Accept: 'application/json',
    ...(!isFormData && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: requestHeaders,
    credentials: 'include',
    body:
      body === undefined
        ? undefined
        : isFormData
        ? body
        : JSON.stringify(body),
  });

  const parsed = await parseResponse(response);

  if (!response.ok) {
    throw {
      status: response.status,
      message:
        parsed?.message ||
        parsed?.error ||
        parsed?.detail ||
        response.statusText ||
        '요청에 실패했어요.',
      data: parsed,
      raw: parsed,
    };
  }

  return parsed;
}
