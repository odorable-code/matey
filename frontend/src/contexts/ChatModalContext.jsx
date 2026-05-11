/**
 * =========================================================
 * 파일명 : src/contexts/ChatModalContext.jsx
 * 역할   : 채팅 모달 전역 컨트롤러 + 채팅방 세션 관리
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 모달 열기/닫기
 * - 좌측 사이드바는 항상 채팅방 목록 (고정)
 * - 우측 영역(rightView) 만 동적: 'empty' / 'chat' / 'pick'
 * - 활성 세션 + 메시지 추가 + 세션 삭제
 *
 * [이번 수정 핵심]
 * - 카톡 데스크탑 톤: 좌측 항상 목록 / 우측만 변함
 * - rightView 도입:
 *   * 'empty' : 우측 빈 상태 (왼쪽에서 골라주세요)
 *   * 'chat'  : 채팅방 열림
 *   * 'pick'  : 새 상담 봇 고르기 (게임 캐릭터 픽 톤)
 *
 * [수정 포인트]
 * - 초기 대화 목록 : INITIAL_SESSIONS (기본 비움 — 메이트 지정은 시작 시에만)
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
// 1. 시간 포맷
// ============================================================
function relativeTimeString(timestamp) {
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h < 12 ? '오전' : '오후';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${hh}:${m}`;
}

// ============================================================
// 2. 초기 대화 목록 (지정된 메이트 없음 — 사용자가 고르기 전까지 비움)
// ============================================================
const INITIAL_SESSIONS = [];

// ============================================================
// 3. 우측 영역 상태
// ============================================================
const RIGHT = {
  EMPTY: 'empty',
  CHAT: 'chat',
  PICK: 'pick',
};

const ChatModalContext = createContext(null);

export function ChatModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rightView, setRightView] = useState(RIGHT.EMPTY);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);

  // -------- 모달 열기 --------
  // mateKey 주면 즉시 새 세션 만들고 채팅 시작
  // 없으면 메이트 고르기(PICK) — 빈 안내 화면 대신 바로 선택 UI
  const openChat = useCallback((mateKey = null) => {
    if (mateKey) {
      const id = `s-${Date.now()}`;
      setSessions((prev) => [
        {
          id,
          mateKey,
          title: '새로운 대화',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          unread: 0,
          messages: [],
        },
        ...prev,
      ]);
      setActiveSessionId(id);
      setRightView(RIGHT.CHAT);
    } else {
      setActiveSessionId(null);
      setRightView(RIGHT.PICK);
    }
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => setIsOpen(false), []);

  // -------- 우측 영역 컨트롤 --------
  const showEmpty = useCallback(() => {
    setActiveSessionId(null);
    setRightView(RIGHT.EMPTY);
  }, []);

  /** 모바일 등에서 목록만 보이게 할 때 (대화 영역 닫기) */
  const exitChatToList = useCallback(() => {
    setActiveSessionId(null);
    setRightView(RIGHT.EMPTY);
  }, []);

  const showPick = useCallback(() => {
    setActiveSessionId(null);
    setRightView(RIGHT.PICK);
  }, []);

  // -------- 새 세션 시작 --------
  const startNewSession = useCallback((mateKey) => {
    const id = `s-${Date.now()}`;
    const newSession = {
      id,
      mateKey,
      title: '새로운 대화',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      unread: 0,
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(id);
    setRightView(RIGHT.CHAT);
  }, []);

  // -------- 기존 방 열기 --------
  const openSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, unread: 0 } : s)),
    );
    setRightView(RIGHT.CHAT);
  }, []);

  // -------- 세션 삭제 --------
  const deleteSession = useCallback((sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setActiveSessionId((prev) => {
      if (prev === sessionId) {
        setRightView(RIGHT.EMPTY);
        return null;
      }
      return prev;
    });
  }, []);

  // -------- 메시지 추가 --------
  const appendMessage = useCallback((sessionId, message) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          updatedAt: Date.now(),
          messages: [...s.messages, message],
          title:
            s.messages.length === 0 && message.role === 'user'
              ? message.text.slice(0, 20)
              : s.title,
        };
      }),
    );
  }, []);

  // -------- ESC / body lock --------
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeChat();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeChat]);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.classList.add('matey-chat-modal-open');
      return () => {
        document.body.style.overflow = prev;
        document.body.classList.remove('matey-chat-modal-open');
      };
    }
    return undefined;
  }, [isOpen]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  const value = {
    isOpen,
    rightView,
    sessions,
    activeSession,
    activeSessionId,
    RIGHT,
    openChat,
    closeChat,
    showEmpty,
    exitChatToList,
    showPick,
    startNewSession,
    openSession,
    deleteSession,
    appendMessage,
    relativeTimeString,
  };

  return (
    <ChatModalContext.Provider value={value}>
      {children}
    </ChatModalContext.Provider>
  );
}

export function useChatModal() {
  const ctx = useContext(ChatModalContext);
  if (!ctx) {
    throw new Error('useChatModal은 ChatModalProvider 안에서만 사용할 수 있어요.');
  }
  return ctx;
}
