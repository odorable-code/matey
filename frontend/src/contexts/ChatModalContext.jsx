/**
 * =========================================================
 * 파일명 : src/contexts/ChatModalContext.jsx
 * 역할   : 채팅 모달 전역 컨트롤러 (Context)
 * =========================================================
 *
 * [주요 위치]
 * - Provider : App.jsx 최상단을 감쌈
 * - 사용처   : 어디서든 useChatModal() 훅으로 openChat / closeChat 호출
 *
 * [수정 포인트]
 * - 기본 선택 메이트(defaultMateKey)를 바꾸고 싶으면 openChat 인자로 넘기기
 *   ex) openChat('cat')  → 나비로 시작
 * =========================================================
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ============================================================
// 1. Context 생성
// ============================================================
const ChatModalContext = createContext(null);

// ============================================================
// 2. Provider 컴포넌트
// ============================================================
export function ChatModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMateKey, setActiveMateKey] = useState('dog');

  // -------- 열기 --------
  const openChat = useCallback((mateKey = 'dog') => {
    setActiveMateKey(mateKey);
    setIsOpen(true);
  }, []);

  // -------- 닫기 --------
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // -------- ESC 키로 닫기 --------
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeChat();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeChat]);

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

  const value = {
    isOpen,
    activeMateKey,
    setActiveMateKey,
    openChat,
    closeChat,
  };

  return <ChatModalContext.Provider value={value}>{children}</ChatModalContext.Provider>;
}

// ============================================================
// 3. 커스텀 훅
// ============================================================
export function useChatModal() {
  const ctx = useContext(ChatModalContext);
  if (!ctx) {
    throw new Error('useChatModal은 ChatModalProvider 안에서만 사용할 수 있어요.');
  }
  return ctx;
}
