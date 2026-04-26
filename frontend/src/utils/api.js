// 주소 끝에 붙은 슬래시 제거
// 어떤 사람은 ...api, 어떤 사람은 ...api/ 로 쓸 수도 있으니.
const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'
).replace(/\/$/, '');

const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
const TOKEN_KEY = 'matey_access_token';

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// LocalStorage의 Access Token을 지움!
export function setStoredToken(token) {
  if (token) {
    // TOKEN_KEY 라는 변수의 값을 token으로 지정
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
        : (isJson
        ? JSON.stringify(body)
        : body),
    credentials,
  });

  const text = await response.text();
  // try 밖에서도 data를 사용하기 위해 try 밖에서 미리 선언.
  let data = null;

  try {
    // text를 json 객체로 변환
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

//서버 개발자마다, 혹은 같은 서버라도 API 종류에 따라 토큰 이름을 다르게 줄 때가 있다. 어떤 API는 accessToken이라고 주고, 어떤 API는 짧게 token이라고 준다.
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

export async function login({ email, password, rememberMe }) {
  const payload = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: { email, password, rememberMe },
  });

  const accessToken = normalizeToken(payload);
  const user = normalizeUser(payload);

  if (!payload.ok) {
    throw new Error(payload.message || '비밀번호 재설정에 실패했습니다.');
  }


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

export async function signup({ 
  nickname,
  email,
  password,
  termsAgreed,
  privacyAgreed,
  marketingAgreed
}) {
  const payload = await request('/api/v1/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      nickname,
      email,
      password,
      termsAgreed: !!termsAgreed, 
      privacyAgreed: !!privacyAgreed, 
      marketingAgreed: !!marketingAgreed
    },
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

export async function checkEmailDuplicate(email) {
  // 이메일을 쿼리 스트링으로 전달 (api/v1/auth/check-email?email=...)
  const payload = await request(`/api/v1/auth/check-email?email=${encodeURIComponent(email)}`, {
    method: 'GET',
  });

  return payload?.isEmailDuplicate || false;
}

export async function getMyProfile() {
  const payload = await request('api/v1/auth/me', {
    method: 'GET',
  });

  return normalizeUser(payload) || payload;
}

export async function forgotPassword(email) {
  const payload = await request('/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: { email },
  });


  return {
    raw: payload,
    message:
      payload?.message ||
      '비밀번호 재설정 링크를 이메일로 보냈어요. 메일함을 확인해 주세요.',
  };
}

export async function resetPassword(token, newpassword) {
  const payload = await request('/api/v1/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      token,
      newpassword
    }),
  });

  return {
    raw: payload,
    message:
      payload?.message || 
      '비밀번호가 성공적으로 변경되었습니다.',
  };
}

export async function forgotId(name, email) {
  const payload = await request('/api/v1/auth/forgot-id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: { name, email },
  });


  return {
    raw: payload,
    message:
      payload?.message ||
      '입력하신 정보와 일치하는 아이디를 찾았어요.',
  };
}

export async function logout() {
  try {
    const payload = await request('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
    },
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
  // 정규식 검사는 오직 문자열에서만 작동하기 때문에 email을 String으로 변환한다(email이 null, undefined 등으로 담겨 올 수 있기 때문에)
  // .test: email을 정규식과 비교해서 일치하면 true, 불일치하면 false를 반환
  // 영어만 허용, @ 앞: 영어 대소문자, 숫자, 특수문자(., _, %, +, -)만 허용, + 때문에 @ 전 최소 1글자 이상, @는 딱 1개만 존재
  // @ 뒤: 영어 대소문자, 숫자, 특수문자(-, .)만 허용
  // . 뒤: 실제 점이 1개 찍혀야함, 영어 대소문자(숫자x), 최소 2글자 이상
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email).trim());
}

export { getStoredToken };
