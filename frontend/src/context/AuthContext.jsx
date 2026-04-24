// src/context/AuthContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getMyProfile,
  getSocialLoginUrl,
  getStoredToken,
  login as loginRequest,
  logout as logoutRequest,
  setStoredToken,
  signup as signupRequest,
} from '../utils/api';

const AuthContext = createContext(null);

const USER_STORAGE_KEY = 'mateyUser';
const LEGACY_USER_STORAGE_KEY = 'user';

const MOCK_USERS = [
  {
    id: 1,
    email: 'admin@test.com',
    password: 'password123',
    nickname: '관리자',
    role: 'ADMIN',
  },
  {
    id: 2,
    email: 'user@test.com',
    password: 'password123',
    nickname: '일반사용자',
    role: 'USER',
  },
];

function getStoredUser() {
  const raw =
    window.localStorage.getItem(USER_STORAGE_KEY) ||
    window.localStorage.getItem(LEGACY_USER_STORAGE_KEY);

  if (!raw) return null;

  try {
    // 로컬스토리지는 문자열만 저장하기 때문에 저장된 문자열을 json.parse를 통해 객체로 변환
    return JSON.parse(raw);
  } catch (error) {
    console.error("getStoredUser에서 에러 발생", error)
    // return undefined 를 막기 위해 값으로 null을 넣어서 "데이터가 있긴 한데 읽을 수 없는 상태네? 없는 셈 치자(null)."라고 안전하게 처리됨
    return null;
  }
}

function setStoredUser(user) {
  if (user) {
    const serialized = JSON.stringify(user);
    window.localStorage.setItem(USER_STORAGE_KEY, serialized);
    window.localStorage.setItem(LEGACY_USER_STORAGE_KEY, serialized);
  } else {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  }
}

function clearStoredAuth() {
  // if (user)가 false가 되어 else문이 실행됨
  setStoredToken(null);
  setStoredUser(null);
  window.localStorage.removeItem('accessToken');
  window.localStorage.removeItem('mateyToken');
}

function createMockToken(user) {
  return `mock-token-${user.id}-${Date.now()}`;
}

function isMockToken(token) {
  return String(token || '').startsWith('mock-token-');
}

function findMockUser(email, password) {
  return MOCK_USERS.find(
    (item) => item.email === String(email || '').trim() && item.password === password
  );
}

function sanitizeMockUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
  };
}

function extractTokenFromUrl() {
  // new URL(): 내장 객체, 현재 브라우저 주소창에 떠 있는 복잡한 전체 URL 문자열을 가져와서 js가 요리하기 쉬운 객체 형태로 변환
  // ex. "https://example.com/login?token=abc#hello" -> url.pathname, url.searchParams, url.hash 같은 속성별로 깔끔하게 정리된 상자를 만들고
  // const queryToken = url.searchParams.get('accessToken'); 이런식으로 간단하게 원하는 속성을 꺼내 쓸 수 있다.
  const url = new URL(window.location.href);
  const queryToken = url.searchParams.get('accessToken') || url.searchParams.get('token');

  let hashToken = '';
  if (url.hash) {
    const hash = url.hash.replace(/^#/, '');
    // 주소창의 ? 뒷부분을 분석
    const params = new URLSearchParams(hash);
    hashToken = params.get('accessToken') || params.get('token') || '';
  }

  const token = queryToken || hashToken;

  if (!token) return '';

  url.searchParams.delete('accessToken');
  url.searchParams.delete('token');
  url.hash = '';

  // window.history.replaceState(): 브라우저 히스토리(방문 기록)을 조작하는 메서드
  // replaceState의 특징: 새로운 기록을 추가하지 않고, 현재 페이지 기록을 새 주소로 덮어씌움. 효과: 이렇게 하면 사용자가 브라우저의 '뒤로 가기' 버튼을 눌러도 토큰이 노출된 이전 주소로 돌아가지 않음. (증거 인멸)
  // 사용자가 주소창을 복사해서 친구에게 보내거나, 화면을 캡처할 때 내 로그인 토큰이 유출되는 것을 막기 위한 보안 조치
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);

  return token;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken() || '');
  const [user, setUser] = useState(getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);

  const clearAuth = useCallback(() => {
    clearStoredAuth();
    setToken('');
    setUser(null);
  }, []);

  const syncProfile = useCallback(async () => {
    const currentToken = getStoredToken();

    if (!currentToken) {
      setToken('');
      setUser(null);
      return null;
    }

    if (isMockToken(currentToken)) {
      const storedUser = getStoredUser();
      setToken(currentToken);
      setUser(storedUser);
      return storedUser;
    }

    try {
      const profile = await getMyProfile();
      setToken(currentToken);
      setUser(profile);
      setStoredUser(profile);
      return profile;
    } catch (error) {
      clearAuth();
      return null;
    }
  }, [clearAuth]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const urlToken = extractTokenFromUrl();

        if (urlToken) {
          setStoredToken(urlToken);
          setToken(urlToken);
        }

        const currentToken = urlToken || getStoredToken();
        const storedUser = getStoredUser();

        if (!currentToken) {
          if (mounted) {
            setAuthLoading(false);
          }
          return;
        }

        if (isMockToken(currentToken)) {
          if (mounted) {
            setToken(currentToken);
            setUser(storedUser);
            setAuthLoading(false);
          }
          return;
        }

        await syncProfile();
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    bootstrap();

    const handleStorage = () => {
      const nextToken = getStoredToken() || '';
      const nextUser = getStoredUser();

      setToken(nextToken);
      setUser(nextUser);
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, [syncProfile]);

  const login = useCallback(
    async ({ email, password }) => {
      const trimmedEmail = String(email || '').trim();
      const rawPassword = String(password || '');

      const mockUser = findMockUser(trimmedEmail, rawPassword);

      if (mockUser) {
        const safeUser = sanitizeMockUser(mockUser);
        const mockToken = createMockToken(mockUser);

        setStoredToken(mockToken);
        setStoredUser(safeUser);

        setToken(mockToken);
        setUser(safeUser);

        return {
          accessToken: mockToken,
          user: safeUser,
          message: '테스트 계정으로 로그인되었어요.',
        };
      }

      const result = await loginRequest({
        email: trimmedEmail,
        password: rawPassword,
      });

      const nextToken = result?.accessToken || '';
      const nextUser = result?.user || (await syncProfile());

      if (nextToken) {
        setStoredToken(nextToken);
      }

      if (nextUser) {
        setStoredUser(nextUser);
      }

      setToken(nextToken || getStoredToken() || '');
      setUser(nextUser || null);

      return {
        ...result,
        accessToken: nextToken,
        user: nextUser || null,
      };
    },
    [syncProfile]
  );

  const signup = useCallback(
    async ({ nickname, email, password }) => {
      const result = await signupRequest({
        nickname: String(nickname || '').trim(),
        email: String(email || '').trim(),
        password: String(password || ''),
      });

      const nextToken = result?.accessToken || '';
      const nextUser = result?.user || (await syncProfile());

      if (nextToken) {
        setStoredToken(nextToken);
      }

      if (nextUser) {
        setStoredUser(nextUser);
      }

      setToken(nextToken || getStoredToken() || '');
      setUser(nextUser || null);

      return {
        ...result,
        accessToken: nextToken,
        user: nextUser || null,
      };
    },
    [syncProfile]
  );

  const logout = useCallback(async () => {
    const currentToken = getStoredToken() || token;

    clearAuth();

    try {
      if (currentToken && !isMockToken(currentToken)) {
        await logoutRequest();
      }
    } catch (error) {
      return {
        message: '로그아웃 처리 중 서버 응답은 실패했지만, 현재 기기에서는 로그아웃되었어요.',
      };
    }

    return {
      message: '로그아웃되었어요.',
    };
  }, [clearAuth, token]);

  const socialLogin = useCallback((provider) => {
    const url = getSocialLoginUrl(provider);

    if (!url) {
      throw new Error('소셜 로그인 주소를 찾을 수 없어요.');
    }

    // 현재 브라우저에 표시되고 있는 페이지의 주소(URL)를 새로운 주소로 변경
    window.location.href = url;
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    setStoredUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      authLoading,
      login,
      signup,
      logout,
      socialLogin,
      refreshProfile: syncProfile,
      setUser: updateUser,
      clearAuth,
    }),
    [
      user,
      token,
      authLoading,
      login,
      signup,
      logout,
      socialLogin,
      syncProfile,
      updateUser,
      clearAuth,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서 사용해야 해요.');
  }

  return context;
}

export default AuthContext;
