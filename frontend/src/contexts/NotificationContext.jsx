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

// ============================================================
// 1. 초기 샘플 데이터 (추후 API로 교체)
// ============================================================
const INITIAL_NOTIFICATIONS = [
  {
    id: 'noti-1',
    type: 'system',
    title: '메이티에 오신 걸 환영해요',
    message: '오늘은 어떤 메이트와 한 줄 이야기 시작해볼까요?',
    createdAt: Date.now() - 1000 * 60 * 3, // 3분 전
    read: false,
  },
  {
    id: 'noti-2',
    type: 'mate',
    title: '루루가 메모를 남겼어요',
    message: '“오늘 하루도 수고 많았어요. 천천히 쉬어가도 괜찮아요.”',
    createdAt: Date.now() - 1000 * 60 * 35, // 35분 전
    read: false,
  },
  {
    id: 'noti-3',
    type: 'update',
    title: '새로운 업데이트 안내',
    message: '메이트 프로필 카드 디자인이 더 깔끔하게 개선됐어요.',
    createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5시간 전
    read: true,
  },
];

// ============================================================
// 2. Context 생성
// ============================================================
const NotificationContext = createContext(null);

// ============================================================
// 3. Provider 컴포넌트
// ============================================================
export function NotificationProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // -------- 모달 열기 / 닫기 --------
  const openNotifications = useCallback(() => setIsOpen(true), []);
  const closeNotifications = useCallback(() => setIsOpen(false), []);

  // -------- 단일 읽음 처리 --------
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  // -------- 전체 읽음 처리 --------
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // -------- 새 알람 추가 (외부에서 push) --------
  const pushNotification = useCallback((payload) => {
    const newItem = {
      id: `noti-${Date.now()}`,
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
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
