/**
 * =========================================================
 * 파일명 : src/contexts/NotificationContext.jsx
 * 역할   : 시스템 알람 상태 + 알람 모달 컨트롤러 (Context)
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 알람 모달 열고 닫기 (openNotifications / closeNotifications)
 * - 알람 목록(notifications) 보관
 * - 읽음 처리 (markAsRead, markAllAsRead)
 * - 알람 추가 (pushNotification) — 나중에 WebSocket / API 연결 시 사용
 * - 안 읽은 알람 개수(unreadCount) 계산 → 헤더 빨간 점에 사용
 *
 * [주요 위치]
 * - Provider : App.jsx 최상단에서 전체 앱 감쌈
 * - 사용처   : useNotifications() 훅으로 어디서든 호출
 *
 * [수정 포인트]
 * - 초기 샘플 데이터 : INITIAL_NOTIFICATIONS
 *   → 실제 API 연결 시 빈 배열로 두고 fetch 결과로 채우기
 * - 새 알람 추가     : pushNotification({ type, title, message })
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
import { notificationAPI } from '../utils/api';
import { useAuth } from './AuthContext';

// ============================================================
// 1. Context 생성
// ============================================================
const NotificationContext = createContext(null);

// ============================================================
// 2. Provider 컴포넌트
// ============================================================
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

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

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
    openNotifications,
    closeNotifications,
    markAsRead,
    markAllAsRead,
    pushNotification,
    removeNotification,
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
