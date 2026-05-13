/**
 * =========================================================
 * 파일명 : src/contexts/NotificationContext.jsx
 * 역할   : 시스템 알람 상태 + 알람 모달 컨트롤러 + 브라우저 알림 (Context)
 * =========================================================
 *
 * [주요 기능]
 * 1. 서버 알림 데이터를 주기적으로 폴링하여 상태 관리
 * 2. 사용자별 알림 상세 설정 (type_code별 on/off) 연동
 * 3. pushNotice 활성 시 브라우저 Notification API로 데스크탑 알림 발송
 * 4. 안 읽은 수는 경량 API(/unread-count)로 빠르게 갱신
 * 5. 알림 모달(팝오버) 열기/닫기 제어
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { notificationAPI, myPageAPI } from 'utils/api';
import { useAuth } from './AuthContext';

const SETTINGS_BASE_KEY = 'matey_user_settings';
const INITIAL_SETTINGS = {
  pushNotice: true,
  marketingNotice: false,
  casualTone: false,
  noti_BOT_MESSAGE: true,
  noti_CHAT_REMINDER: true,
  noti_COMMENT_REPLY: true,
  noti_COMMUNITY_HOT: true,
  noti_EVENT_NOTICE: true,
  noti_POINT_REWARD: true,
  noti_POST_COMMENT: true,
  noti_REPORT_RESULT: true,
  noti_SUPPORT_ANSWER: true,
  noti_SYSTEM_NOTICE: true,
};

/** 알림 type_code → 설정 키 매핑 */
const TYPE_CODE_TO_SETTING_KEY = {
  BOT_MESSAGE: 'noti_BOT_MESSAGE',
  CHAT_REMINDER: 'noti_CHAT_REMINDER',
  COMMENT_REPLY: 'noti_COMMENT_REPLY',
  COMMUNITY_HOT: 'noti_COMMUNITY_HOT',
  EVENT_NOTICE: 'noti_EVENT_NOTICE',
  POINT_REWARD: 'noti_POINT_REWARD',
  POST_COMMENT: 'noti_POST_COMMENT',
  REPORT_RESULT: 'noti_REPORT_RESULT',
  SUPPORT_ANSWER: 'noti_SUPPORT_ANSWER',
  SYSTEM_NOTICE: 'noti_SYSTEM_NOTICE',
};

// ============================================================
// 1. Context 생성
// ============================================================
const NotificationContext = createContext(null);

// ============================================================
// 2. 브라우저 알림 유틸
// ============================================================

/** 브라우저 Notification API 권한 요청 (사용자가 허용해야 동작) */
function requestBrowserPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {
      // 사용자 거부 또는 브라우저 미지원 — 무시
    });
  }
}

/** 브라우저 데스크탑 알림 발송 */
function showBrowserNotification(title, body, onClick) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const noti = new Notification(title, {
      body,
      icon: '/images/mascots/dog/dog.png',
      badge: '/images/mascots/dog/dog.png',
      tag: `matey-${Date.now()}`,
      requireInteraction: false,
      silent: false,
    });
    // 알림 클릭 시 창으로 포커스 이동
    noti.onclick = () => {
      window.focus();
      if (typeof onClick === 'function') onClick();
      noti.close();
    };
    // 10초 후 자동 닫기
    setTimeout(() => noti.close(), 10000);
  } catch (e) {
    // iOS Safari 등 일부 환경에서 Notification 생성자 미지원
    console.warn('브라우저 알림 생성 실패:', e);
  }
}

// ============================================================
// 3. Provider 컴포넌트
// ============================================================
export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * ref로 settings를 추적 — fetchNotifications의 useCallback 의존성에서
   * settings를 제거하여 무한 루프를 방지합니다.
   */
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  /** 마지막으로 확인한 알림 ID (브라우저 알림 중복 방지용) */
  const lastSeenIdRef = useRef(null);

  /** 설정 로드 중복 방지 플래그 */
  const settingsLoadedRef = useRef(false);

  // 사용자별 고유 스토리지 키 생성 (예: matey_user_settings_12)
  const settingsStorageKey = useMemo(() => {
    const userId = user?.userId || user?.user_id || user?.id;
    return userId ? `${SETTINGS_BASE_KEY}_${userId}` : null;
  }, [user]);

  // -------- 로그인한 사용자 설정 로드 (사용자 바뀔 때마다 실행) --------
  useEffect(() => {
    if (!settingsStorageKey) {
      setSettings(INITIAL_SETTINGS);
      settingsLoadedRef.current = false;
      return;
    }

    const saved = localStorage.getItem(settingsStorageKey);
    if (saved) {
      try {
        setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        // localStorage 파싱 실패 — 기본값 유지
      }
    }
  }, [settingsStorageKey]);

  // -------- 설정 변경 시 해당 사용자 키로 저장 --------
  useEffect(() => {
    if (settingsStorageKey) {
      localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    }
  }, [settings, settingsStorageKey]);

  // -------- pushNotice 활성화 시 브라우저 권한 요청 --------
  useEffect(() => {
    if (settings.pushNotice && isAuthenticated) {
      requestBrowserPermission();
    }
  }, [settings.pushNotice, isAuthenticated]);

  // -------- 알람 로드 (의존성에 settings 없음 → ref로 읽기) --------
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationAPI.getNotifications();
      const currentSettings = settingsRef.current;

      // 백엔드 데이터 -> 프론트엔드 형식 변환
      const transformed = data.map((n) => {
        const rawRead = n.read ?? n.isRead ?? n.is_read;
        const read =
          rawRead === true ||
          rawRead === 1 ||
          rawRead === '1';
        return {
          id: n.notificationId,
          type: n.type,
          typeCode: n.typeCode ?? n.type_code,
          title: n.title,
          message: n.message,
          createdAt: new Date(n.createdAt).getTime(),
          read,
          targetType: n.targetType ?? n.target_type,
          targetId: n.targetId ?? n.target_id,
        };
      });

      // 새 알림 감지 → 브라우저 알림 발송
      if (currentSettings.pushNotice && transformed.length > 0) {
        const newestId = transformed[0].id;
        if (lastSeenIdRef.current != null && newestId !== lastSeenIdRef.current) {
          // 이전에 없었던 새 알림들 추출
          const newItems = transformed.filter(
            (n) => !n.read && n.id > lastSeenIdRef.current
          );
          for (const item of newItems) {
            const settingKey = TYPE_CODE_TO_SETTING_KEY[item.typeCode];
            if (!settingKey || currentSettings[settingKey] !== false) {
              showBrowserNotification(
                item.title || '새로운 알림',
                item.message || '',
                () => setIsOpen(true),
              );
            }
          }
        }
        lastSeenIdRef.current = newestId;
      } else if (transformed.length > 0) {
        lastSeenIdRef.current = transformed[0].id;
      }

      setNotifications(transformed);
      setUnreadCount(transformed.filter((n) => !n.read).length);
    } catch (err) {
      console.error('알림 로드 실패:', err);
    }
  }, [isAuthenticated]); // ← settings 의존성 제거 (ref 사용)

  // -------- 안 읽은 수만 경량 조회 (뱃지 폴링용) --------
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return null;
    try {
      const data = await notificationAPI.getUnreadCount();
      const count = data?.count ?? 0;
      setUnreadCount(count);
      return count;
    } catch (err) {
      return null;
    }
  }, [isAuthenticated]);

  // -------- 서버 설정 로드 (1회만 실행) --------
  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    if (settingsLoadedRef.current) return; // 중복 호출 방지
    settingsLoadedRef.current = true;
    try {
      const data = await myPageAPI.getSettings();
      if (data) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('설정 로드 실패:', err);
      settingsLoadedRef.current = false; // 실패 시 재시도 허용
    }
  }, [isAuthenticated]);

  // -------- 초기 로드: 알림 + 설정 (1회) --------
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    fetchSettings();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // 라우트 이동 시에도 1회 동기화(새 알림이 바로 뱃지에 반영되도록)
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // 주기·포커스 시 알림 재조회 (탭 복귀·백그라운드 반영)
  // - 30초마다 경량 unread-count 조회
  // - unread가 증가하면 전체 목록을 다시 가져옴 (브라우저 알림 트리거용)
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let prevUnread = unreadCount;

    const poll = async () => {
      const newCount = await fetchUnreadCount();
      if (newCount != null && newCount > prevUnread) {
        await fetchNotifications();
        prevUnread = newCount;
      } else if (newCount != null) {
        prevUnread = newCount;
      }
    };

    const intervalId = window.setInterval(poll, 30000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') poll();
    };
    const onFocus = () => poll();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------- 모달 열기 / 닫기 --------
  const openNotifications = useCallback(() => {
    setIsOpen(true);
    fetchNotifications();
  }, [fetchNotifications]);
  const closeNotifications = useCallback(() => setIsOpen(false), []);

  // -------- 단일 읽음 처리 --------
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  }, []);

  // -------- 전체 읽음 처리 --------
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('전체 알림 읽음 처리 실패:', err);
    }
  }, []);

  // -------- 설정 업데이트 (무한루프 방지: API 호출 후 재조회 안 함) --------
  const updateSetting = useCallback(async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    // pushNotice가 켜지면 브라우저 권한 요청
    if (key === 'pushNotice' && value) {
      requestBrowserPermission();
    }

    try {
      if (key === 'pushNotice' || key === 'marketingNotice' || key === 'casualTone' || key.startsWith('noti_')) {
        await myPageAPI.updateSettings({ settingKey: key, settingValue: value });
      }
    } catch (err) {
      console.error('설정 업데이트 실패:', err);
    }
  }, []);

  // -------- 새 알람 추가 (로컬에서 즉시 반영 용도) --------
  const pushNotification = useCallback((payload) => {
    const newItem = {
      id: `local-${Date.now()}`,
      type: 'system',
      title: '새 알림',
      message: '',
      createdAt: Date.now(),
      read: false,
      ...payload,
    };
    setNotifications((prev) => [newItem, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // 브라우저 알림도 발송
    if (settingsRef.current.pushNotice) {
      showBrowserNotification(
        newItem.title,
        newItem.message,
        () => setIsOpen(true),
      );
    }
  }, []);

  // -------- 알람 삭제 --------
  const removeNotification = useCallback(async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err) {
      console.error('알림 삭제 실패:', err);
    }
  }, []);

  // -------- ESC 키로 닫기 --------
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeNotifications();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeNotifications]);

  // -------- 설정에 따라 필터링된 알림 목록 --------
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const settingKey = TYPE_CODE_TO_SETTING_KEY[n.typeCode];
      if (!settingKey) return true;
      return settings[settingKey] !== false;
    });
  }, [notifications, settings]);

  const value = {
    isOpen,
    notifications: filteredNotifications,
    unreadCount,
    settings,
    openNotifications,
    closeNotifications,
    markAsRead,
    markAllAsRead,
    pushNotification,
    removeNotification,
    updateSetting,
    fetchSettings,
    fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ============================================================
// 4. 커스텀 훅
// ============================================================
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      'useNotifications는 NotificationProvider 안에서만 사용할 수 있어요.',
    );
  }
  return ctx;
}
