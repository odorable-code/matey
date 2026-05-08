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
import { notificationAPI, myPageAPI } from '../utils/api';
import { useAuth } from './AuthContext';

const SETTINGS_BASE_KEY = 'matey_user_settings';
const INITIAL_SETTINGS = {
  pushNotice: true,
  emailNotice: false,
  gentleTone: true,
  quickReply: true,
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
      const transformed = data.map((n) => ({
        id: n.notificationId,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: new Date(n.createdAt).getTime(),
        read: n.isRead,
      }));
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
        // 서버 데이터를 LocalStorage/State에 병합
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
      if (key === 'pushNotice' || key === 'emailNotice' || key.startsWith('noti_')) {
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

  // -------- 열릴 때 body 스크롤 잠금 --------
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [isOpen]);

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
