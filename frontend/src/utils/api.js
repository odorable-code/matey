// 주소 끝 슬래시 제거. '' 이면 브라우저가 /api 를 CRA(3000)로 보냄 → 프록시가 없거나 빗나가면 index.html 이 와서 깨짐.
const rawApiBase = process.env.REACT_APP_API_BASE_URL;
function defaultApiBaseUrl() {
  // 기본은 스프링(8080) 직접. CRA에 상대 /api만 보내면 index.html 이 올 수 있어 기본값은 비우지 않음. 프록시만 쓰려면 .env 에 REACT_APP_API_BASE_URL=
  return 'http://localhost:8080';
}
export const API_BASE_URL =
  rawApiBase === ''
    ? ''
    : String(
        rawApiBase !== undefined && rawApiBase !== null && rawApiBase !== ''
          ? rawApiBase
          : defaultApiBaseUrl()
      ).replace(/\/$/, '');

const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

/**
 * fetch 주소 조합:
 * - base 가 비어 있으면 path 만 씀 → 개발 프록시·동일 출처 배포에 맞춤.
 * - base 가 .../api 인데 path 도 /api/... 면 /api 가 두 번 붙지 않게 함.
 */
function resolveRequestUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE_URL.replace(/\/$/, '');
  if (!base) {
    return normalizedPath;
  }
  if (base.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${base}${normalizedPath.replace(/^\/api/, '')}`;
  }
  return `${base}${normalizedPath}`;
}
const TOKEN_KEY = 'matey_access_token';

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** AuthContext 테스트 로그인과 동일 규칙 — mock 토큰으로는 스프링 JWT 검증을 통과하지 못함 */
export function isMockAccessToken(tokenOpt) {
  const t = tokenOpt !== undefined ? tokenOpt : getStoredToken();
  return String(t || '').startsWith('mock-token-');
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

/** 로컬 저장된 로그인 정보 제거 (토큰 만료·강제 로그아웃 시 공통 사용) */
export function clearClientAuthSession() {
  setStoredToken(null);
  window.localStorage.removeItem('mateyUser');
  window.localStorage.removeItem('user');
  window.localStorage.removeItem('accessToken');
  window.localStorage.removeItem('mateyToken');
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

/** 동일 출처(개발 프록시·상대 경로)면 쿠키 불필요·CORS 단순. 절대 URL로 백엔드 직결이면 예전과 같이 include 유지 */
function defaultFetchCredentials() {
  const base = String(API_BASE_URL || '').trim();
  if (!base) return 'omit';
  return 'include';
}

async function request(
  path,
  {
    method = 'GET',
    body,
    headers = {},
    isJson = true,
    credentials = defaultFetchCredentials(),
  } = {}
) {
  const m = String(method || 'GET').toUpperCase();
  const p = typeof path === 'string' ? path : '';
  if (
    m !== 'GET' &&
    m !== 'HEAD' &&
    m !== 'OPTIONS' &&
    p.startsWith('/api') &&
    !p.startsWith('/api/v1/auth/login') &&
    !p.startsWith('/api/v1/auth/signup') &&
    !p.startsWith('/api/v1/auth/admin/signup') &&
    isMockAccessToken()
  ) {
    const err = new Error(
      '테스트(mock) 로그인으로는 서버 API를 호출할 수 없어요. DB에 등록된 계정으로 로그인한 뒤 다시 시도해 주세요.'
    );
    err.status = 401;
    err.code = 'MOCK_TOKEN_BLOCKED';
    throw err;
  }

  const url = resolveRequestUrl(path);
  let response;
  try {
    response = await fetch(url, {
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
  } catch (networkErr) {
    const raw = String(networkErr?.message || networkErr || '');
    const hint =
      raw === 'Failed to fetch' || /network/i.test(raw)
        ? ' 서버(보통 localhost:8080)가 실행 중인지 확인하고, 주소창은 localhost와 127.0.0.1을 섞어 쓰지 마세요.'
        : '';
    const err = new Error(
      (raw === 'Failed to fetch' ? '서버에 연결하지 못했어요.' : raw) + hint
    );
    err.cause = networkErr;
    err.code = 'FETCH_NETWORK_ERROR';
    throw err;
  }

  const text = await response.text();
  const isApiPath = typeof path === 'string' && path.startsWith('/api');
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();

  // CRA 가 /api 를 못 넘기면 index.html(text/html) 이 옴. 본문만 보고 판단하면 JSON 과 충돌할 수 있어 헤더 우선.
  const looksLikeHtmlPage =
    contentType.includes('text/html') ||
    (!contentType.includes('application/json') &&
      text &&
      text.length < 200000 &&
      /^\s*<\s*!DOCTYPE\s+html/i.test(text.trim()));

  if (response.ok && isApiPath && looksLikeHtmlPage) {
    const err = new Error(
      'API 대신 HTML 페이지가 왔어요. 스프링(8080) 실행 여부를 확인하고, 주소가 localhost:3000 인데 api.js 가 상대 경로만 쓰는지(.env 의 REACT_APP_API_BASE_URL) 확인해 주세요.'
    );
    err.status = response.status;
    throw err;
  }

  let data = null;
  const trimmed = typeof text === 'string' ? text.trim() : '';
  const shouldParseJson =
    contentType.includes('application/json') ||
    (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('[')));

  if (shouldParseJson) {
    try {
      data = text ? JSON.parse(text) : null;
    } catch (parseErr) {
      // content-type은 JSON인데 본문이 깨진 케이스만 에러로 취급
      if (response.ok && isApiPath) {
        const err = new Error(
          'JSON 형식으로 응답을 받지 못했어요. 서버 응답 형식을 확인해 주세요.'
        );
        err.status = response.status;
        err.data = text || null;
        throw err;
      }
      data = text || null;
    }
  } else {
    // 서버가 단순 문자열(text/plain 등)로 성공 응답을 보내는 경우도 있으므로 그대로 돌려줌
    data = text || null;
  }

  if (!response.ok) {
    // 액세스 토큰 만료·무효 → 저장소 비우고 전역 이벤트로 Auth 상태·화면 동기화
    if (response.status === 401 && getStoredToken()) {
      clearClientAuthSession();
      window.dispatchEvent(new CustomEvent('matey:session-expired'));
    }

    let message =
      data?.message ||
      data?.detail ||
      data?.error ||
      (typeof data === 'string' ? data : null) ||
      '요청 처리 중 오류가 발생했어요.';
    if (response.status === 404) {
      const t = String(message || '').trim();
      if (t === 'Not Found' || /^No static resource\b/i.test(t)) {
        message =
          '요청한 API를 찾을 수 없어요. 서버 주소(REACT_APP_API_BASE_URL)에 /api 가 중복 없는지 확인해 주세요.';
      }
    }
    let msgOut = message;
    if (response.status === 403) {
      const t = String(msgOut || '').trim();
      if (!t || t === 'Forbidden' || t === 'Access Denied') {
        msgOut =
          '접근이 거부되었어요. 로그인이 만료됐거나 권한이 없을 수 있어요. 공지·이벤트 글은 운영자만 작성할 수 있어요.';
      }
    }

    const err = new Error(msgOut);
    // 호출부에서 401/403 등을 구분할 수 있게 상태/원문을 붙입니다.
    err.status = response.status;
    err.data = data;
    throw err;
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
  if (!payload || typeof payload !== 'object') return null;
  // /api/v1/auth/me 는 user 래핑 없이 userId·roleCode 등을 최상위에 둠
  let u = null;
  if (payload.userId != null || payload.roleCode != null || payload.email != null) {
    u = { ...payload };
  } else {
    const inner = payload.user || payload.data?.user || payload.data || null;
    u = inner ? { ...inner } : null;
  }
  if (u && u.roleCode != null && u.role == null) {
    u.role = u.roleCode;
  }
  if (u && u.role != null && u.roleCode == null) {
    u.roleCode = u.role;
  }
  return u;
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

  if (!accessToken) {
    // 토큰이 없는데 message가 있다면 그 메시지를, 없으면 기본 에러를 던집니다.
    throw new Error(payload?.message || '로그인 정보를 확인해주세요.');
  }

  const user = normalizeUser(payload);

  setStoredToken(accessToken);

  return {
    raw: payload,
    accessToken,
    user,
    message: payload?.message || '로그인에 성공했어요.',
  };
}

export async function signup({ 
  userName,
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
      userName,
      nickname,
      email,
      password,
      termsAgreed: termsAgreed, 
      privacyAgreed: privacyAgreed, 
      marketingAgreed: marketingAgreed
    },
    isJson : true,
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
  const payload = await request('/api/v1/auth/me', {
    method: 'GET',
  });

  return normalizeUser(payload) || payload;
}

export async function checkNickNameDuplicate(nickname) {
  // 이메일을 쿼리 스트링으로 전달 (api/v1/auth/check-email?email=...)
  const payload = await request(`/api/v1/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`, {
    method: 'GET',
  });

  return payload?.isNicknameDuplicate || false;
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

export async function resetPassword(token, newPassword) {
  const payload = await request('/api/v1/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body:({ 
      token,
      newPassword
    }),
  });

  return {
    raw: payload,
    message:
      payload?.message || 
      '비밀번호가 성공적으로 변경되었습니다.',
  };
}

export async function forgotId(userName, nickname) {
  const payload = await request('/api/v1/auth/forgot-id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: { userName, nickname },
  });


  return {
    raw: payload,
    message:
      payload?.message ||
      '입력하신 정보와 일치하는 아이디를 찾았어요.',
  };
}

export async function logout() {
  const token = getStoredToken(); // 저장된 토큰 가져오기
  const accessToken = normalizeToken(token);
  try {
    const payload = await request('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
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
    kakao: process.env.REACT_APP_KAKAO_AUTH_URL,
    naver: process.env.REACT_APP_NAVER_AUTH_URL,
  };

  if (customUrlMap[providerKey]) {
    return customUrlMap[providerKey];
  }

  // 백엔드는 Spring OAuth2 Client가 아니라 OAuthController: GET /oauth2/{provider} → 프로바이더로 리다이렉트
  const defaultUrlMap = {
    kakao: `${BACKEND_BASE_URL}/oauth2/kakao`,
    naver: `${BACKEND_BASE_URL}/oauth2/naver`,
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

// ==========================================
// Admin API
// ==========================================

export const adminAPI = {
  // 사용자 관리
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/admin/users${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  getUser: (userId) =>
    request(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'GET',
    }),

  updateUser: (userId, data) => {
    return request(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: data,
    });
  },

  updateUserRole: (userId, roleCode) => {
    return request(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: { roleCode },
    });
  },

  bulkUpdateStatus: (data) => {
    return request('/api/admin/users/batch/status', {
      method: 'POST',
      body: data,
    });
  },

  bulkUpdateRole: (data) => {
    return request('/api/admin/users/batch/role', {
      method: 'POST',
      body: data,
    });
  },

  deleteUser: (userId) => {    return request(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // 피드백 관리
  getFeedbacks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/admin/feedbacks${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  getFeedbackDetail: (supportId) =>
    request(`/api/admin/feedbacks/${encodeURIComponent(String(supportId))}`, {
      method: 'GET',
    }),
  
  updateFeedbackStatus: (feedbackId, status) => {
    return request(`/api/admin/feedbacks/${feedbackId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  answerFeedback: (supportId, content) =>
    request(`/api/admin/feedbacks/${encodeURIComponent(String(supportId))}/answer`, {
      method: 'POST',
      body: { content },
    }),

  // 활동 로그
  getLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/admin/logs${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  // 통계/대시보드
  getDashboardOverview: () => {
    return request('/api/admin/dashboard/overview', {
      method: 'GET',
    });
  },

  getLiveMetrics: () => {
    return request('/api/admin/dashboard/live', {
      method: 'GET',
    });
  },

  /** 상담봇 관리: 누적 지표 + 전월 추천 이벤트·순위 */
  getBotStats: () =>
    request('/api/admin/bots/stats', {
      method: 'GET',
    }),

  /** 공지(ADMIN_NOTICE) — 백엔드에서 ADMIN·SUPER_ADMIN만 허용 */
  createNotice: (body) =>
    request('/api/admin/notices', {
      method: 'POST',
      body,
    }),

  // FAQ (ADMIN 전용)
  getFaqs: () => request('/api/admin/faqs', { method: 'GET' }),
  createFaq: (body) =>
    request('/api/admin/faqs', {
      method: 'POST',
      body,
    }),
  updateFaq: (faqId, body) =>
    request(`/api/admin/faqs/${faqId}`, {
      method: 'PUT',
      body,
    }),

  /** 고민 스포트라이트: 무작위 고민 글 추첨(미리보기) */
  drawWorrySpotlightCandidate: () =>
    request('/api/admin/community/worry-spotlight/draw', { method: 'POST' }),

  /** 고민 스포트라이트: 글·운영 답변 공개 */
  publishWorrySpotlight: (body) =>
    request('/api/admin/community/worry-spotlight', {
      method: 'PUT',
      body,
    }),
};

// ==========================================
// MyPage API
// ==========================================

// ==========================================
// 커뮤니티 (게시글·공지)
// ==========================================

/** 스프링이 List 를 그대로 내보내면 JSON 배열. 가끔 래핑된 형태도 허용 */
function normalizeJsonArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return null;
}

export const communityAPI = {
  getCategories: async () => {
    const raw = await request('/api/community/categories');
    const list = normalizeJsonArray(raw);
    if (list === null) {
      throw new Error(
        '카테고리 응답 형식이 예상과 달라요. 개발자 도구 Network에서 GET /api/community/categories 본문이 JSON 배열인지 확인해 주세요.'
      );
    }
    return list;
  },
  getNotices: () => request('/api/community/notices'),
  getPosts: ({ categoryId, keyword, limit = 20, offset = 0, includeNotice = false } = {}) => {
    const usp = new URLSearchParams();
    if (categoryId != null && categoryId !== '') {
      usp.set('categoryId', String(categoryId));
    }
    if (keyword) {
      usp.set('keyword', keyword);
    }
    if (includeNotice) {
      usp.set('includeNotice', 'true');
    }
    usp.set('limit', String(limit));
    usp.set('offset', String(offset));
    const q = usp.toString();
    return request(`/api/community/posts${q ? `?${q}` : ''}`);
  },
  getPostDetail: (postId) => request(`/api/community/posts/${postId}`),
  createPost: (body) =>
    request('/api/community/posts', { method: 'POST', body }),
  updatePost: (postId, body) =>
    request(`/api/community/posts/${postId}`, { method: 'PUT', body }),
  deletePost: (postId) =>
    request(`/api/community/posts/${postId}`, { method: 'DELETE' }),
  createComment: (postId, body) =>
    request(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      body,
    }),
  updateComment: (postId, commentId, body) =>
    request(`/api/community/posts/${postId}/comments/${commentId}`, {
      method: 'PUT',
      body,
    }),
  deleteComment: (postId, commentId) =>
    request(`/api/community/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    }),
  togglePostLike: (postId) =>
    request(`/api/community/posts/${postId}/like`, { method: 'POST' }),
  togglePostDislike: (postId) =>
    request(`/api/community/posts/${postId}/dislike`, { method: 'POST' }),
  toggleCommentLike: (postId, commentId) =>
    request(`/api/community/posts/${postId}/comments/${commentId}/like`, {
      method: 'POST',
    }),
  drawRandomWorryPost: () => request('/api/community/spotlight/worry-draw'),
  drawRandomStoryPost: () => request('/api/community/spotlight/story-draw'),
  /** 관리자 지정 고민 스포트라이트 + 운영 답변 */
  getWorryFeatured: () => request('/api/community/spotlight/worry-featured'),
  /** 전월 봇 추천 집계 순위 */
  getMonthlyBotRanking: () => request('/api/community/spotlight/bot-ranking/monthly'),
  getYearEndBotRanking: (year) =>
    request(
      `/api/community/spotlight/bot-ranking${year != null && year !== '' ? `?year=${encodeURIComponent(String(year))}` : ''}`
    ),
  toggleBotRecommend: (botId) =>
    request(`/api/community/spotlight/bots/${encodeURIComponent(String(botId))}/recommend`, {
      method: 'POST',
    }),
  addBotDislike: (botId) =>
    request(`/api/community/spotlight/bots/${encodeURIComponent(String(botId))}/dislike`, {
      method: 'POST',
    }),
  getMyBotReactions: () => request('/api/community/spotlight/my-bot-reactions'),
};

// FAQ·문의 분류는 비로그인 조회 가능 (기획: FAQ는 관리자만 편집, 사용자는 읽기)
export const supportPublicAPI = {
  getFaqList: () => request('/api/mypage/support/faq'),
  getReasons: () => request('/api/mypage/support/reasons'),
};

export const supportUserAPI = {
  createTicket: (body) =>
    request('/api/mypage/support', { method: 'POST', body }),
  listTickets: () => request('/api/mypage/support'),
  deleteTicket: (supportId) =>
    request(`/api/mypage/support/${supportId}`, { method: 'DELETE' }),
  reportExists: (targetType, targetId) =>
    request(
      `/api/mypage/support/report-exists?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(String(targetId))}`
    ),
};

export const myPageAPI = {
  getProfile: () => request('/api/mypage/profile'),
  updateProfile: (data) => request('/api/mypage/profile', { method: 'PUT', body: data }),
  getBotMenu: () => request('/api/mypage/bot-menu'),
  interactBot: (data) => request('/api/mypage/bot/interact', { method: 'POST', body: data }),
  getLetters: () => request('/api/mypage/letters'),
  readLetter: (letterId) => request(`/api/mypage/letters/${letterId}/read`, { method: 'PATCH' }),
  deleteLetter: (letterId) => request(`/api/mypage/letters/${letterId}`, { method: 'DELETE' }),
  getSettings: () => request('/api/mypage/settings'),
  updateSettings: (data) => request('/api/mypage/settings', { method: 'PATCH', body: data }),
};

// ==========================================
// Emotion Report API
// ==========================================

export const emotionReportAPI = {
  getDashboard: () => request('/api/emotion-report/dashboard'),
  getList: () => request('/api/emotion-report'),
  getDetail: (analysisId) => request(`/api/emotion-report/${analysisId}`),
};

// ==========================================
// Notifications API
// ==========================================

export const notificationAPI = {
  getNotifications: () => request('/api/notifications'),
  markAsRead: (notificationId) =>
    request(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
  markAllAsRead: () =>
    request('/api/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (notificationId) =>
    request(`/api/notifications/${notificationId}`, { method: 'DELETE' }),
};

