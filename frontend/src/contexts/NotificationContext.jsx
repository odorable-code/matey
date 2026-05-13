/**
 * =========================================================
 * 파일명 : src/contexts/NotificationContext.jsx
 * 역할   : 시스템 알람 상태 + 알람 모달 컨트롤러 (Context)
 * =========================================================
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

// ============================================================
// 1. Context 생성
// ============================================================
const NotificationContext = createContext(null);

// ============================================================
// 2. Provider 컴포넌트
// ============================================================
export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);

  // 사용자별 고유 스토리지 키 생성 (예: matey_user_settings_12)
  const settingsStorageKey = useMemo(() => {
    const userId = user?.userId || user?.user_id || user?.id;
    return userId ? `${SETTINGS_BASE_KEY}_${userId}` : null;
  }, [user]);

  // -------- 로그인한 사용자 설정 로드 (사용자 바뀔 때마다 실행) --------
  useEffect(() => {
    if (!settingsStorageKey) {
      setSettings(INITIAL_SETTINGS);
      return;
    }

    const saved = localStorage.getItem(settingsStorageKey);
    if (saved) {
      try {
        setSettings({ ...INITIAL_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        setSettings(INITIAL_SETTINGS);
      }
    } else {
      setSettings(INITIAL_SETTINGS);
    }
  }, [settingsStorageKey]);

  // -------- 설정 변경 시 해당 사용자 키로 저장 --------
  useEffect(() => {
    if (settingsStorageKey && settings !== INITIAL_SETTINGS) {
      localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    }
  }, [settings, settingsStorageKey]);

  // -------- 알람 로드 --------
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationAPI.getNotifications();
      // 백엔드 데이터 -> 프론트엔드 형식 변환
      // Jackson은 boolean isRead를 JSON에서 `read`로 내보내는 경우가 많아 둘 다 처리
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
      setNotifications(transformed);
    } catch (err) {
      console.error('알림 로드 실패:', err);
    }
  }, [isAuthenticated]);

  // -------- 서버 설정 로드 (동기화) --------
  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await myPageAPI.getSettings();
      if (data) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('설정 로드 실패:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, [fetchNotifications, fetchSettings]);

  // 라우트 이동 시에도 1회 동기화(새 알림이 바로 뱃지에 반영되도록)
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
  }, [location.pathname, isAuthenticated, fetchNotifications]);

  // 주기·포커스 시 알림 재조회 (탭 복귀·백그라운드 반영)
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const intervalId = window.setInterval(() => {
      fetchNotifications();
    }, 60000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchNotifications();
    };
    const onFocus = () => fetchNotifications();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAuthenticated, fetchNotifications]);

  // -------- 모달 열기 / 닫기 --------
  const openNotifications = useCallback(() => setIsOpen(true), []);
  const closeNotifications = useCallback(() => setIsOpen(false), []);

  // -------- 단일 읽음 처리 --------
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  }, []);

  // -------- 전체 읽음 처리 --------
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('전체 알림 읽음 처리 실패:', err);
    }
  }, []);

  // -------- 설정 업데이트 --------
  const updateSetting = useCallback(async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
  }, []);

  // -------- 알람 삭제 --------
  const removeNotification = useCallback(async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
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

  // 헤더 알림은 작은 팝오버라 본문 스크롤을 막지 않음 — 막으면 스크롤바가 사라져 페이지가 옆으로 밀리는 현상이 납니다.

  // -------- 안 읽은 개수 계산 --------
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = {
    isOpen,
    notifications,
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
// 3. 커스텀 훅
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
