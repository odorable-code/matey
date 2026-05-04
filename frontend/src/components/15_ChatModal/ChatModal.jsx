/**
 * =========================================================
 * 파일명 : src/components/15_ChatModal/ChatModal.jsx
 * 역할   : "채팅하기" 버튼 클릭 시 떠오르는 채팅 모달 UI
 * =========================================================
 *
 * [주요 위치]
 * - App.jsx 최상단에서 한 번만 마운트 (Provider 안쪽)
 * - 열고 닫기는 useChatModal() 훅으로 컨트롤
 *
 * [수정 포인트]
 * - 초기 인사 메시지 : INITIAL_GREETING
 * - 메이트 답변 샘플 : SAMPLE_REPLIES
 * - 닫기 동작        : handleOverlayClick / 닫기 버튼
 * - 메이트 데이터    : src/constants/mates.js (MATES)
 * =========================================================
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChatModal } from '../../contexts/ChatModalContext';
import { MATES, MATE_IMAGES, MATE_NAMES, MATE_ROLES } from '../../constants/mates';
import './ChatModal.css';

// ============================================================
// 1. 상수: 인사말 / 샘플 응답
// ============================================================
const INITIAL_GREETING = {
  dog: '안녕! 오늘은 어떤 이야기부터 꺼내볼까요? 가볍게 한 줄이면 충분해요.',
  bear: '천천히 와줘서 고마워요. 머릿속을 같이 정리해볼까요?',
  cat: '핵심만 짚어드릴게요. 어떤 게 궁금하세요?',
  hamster: '괜찮아요, 천천히 말해줘도 돼요. 곁에 있을게요.',
};

const SAMPLE_REPLIES = [
  '음… 그 마음 충분히 이해돼요.',
  '조금 더 자세히 들려줄 수 있어요?',
  '오늘 하루 어땠는지 같이 짚어볼까요?',
  '괜찮아요, 천천히 말해도 돼요.',
];

// ============================================================
// 2. 컴포넌트
// ============================================================
function ChatModal() {
  const { isOpen, activeMateKey, setActiveMateKey, closeChat } = useChatModal();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // -------- 모달 열릴 때 / 메이트 바뀔 때 메시지 초기화 --------
  useEffect(() => {
    if (!isOpen) return;
    setMessages([
      {
        id: `greet-${Date.now()}`,
        role: 'mate',
        text: INITIAL_GREETING[activeMateKey] ?? '안녕! 무슨 이야기든 들려줘요.',
      },
    ]);
    setInputValue('');
    setIsTyping(false);

    // 인풋에 자연스럽게 포커스
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [isOpen, activeMateKey]);

  // -------- 메시지 추가 시 스크롤 하단 고정 --------
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isTyping]);

  // -------- 현재 메이트 정보 --------
  const activeMate = useMemo(
    () => MATES.find((m) => m.key === activeMateKey) ?? MATES[0],
    [activeMateKey],
  );

  // ============================================================
  // 3. 이벤트 핸들러
  // ============================================================
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) closeChat();
  };

  const handleSelectMate = (key) => {
    if (key === activeMateKey) return;
    setActiveMateKey(key);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // 샘플 자동 답장 (실제 서비스에서는 API 호출로 교체)
    const reply = SAMPLE_REPLIES[Math.floor(Math.random() * SAMPLE_REPLIES.length)];
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `mate-${Date.now()}`, role: 'mate', text: reply },
      ]);
      setIsTyping(false);
    }, 900);
  };

  // ============================================================
  // 4. 렌더 (닫혀 있으면 아무것도 그리지 않음)
  // ============================================================
  if (!isOpen) return null;

  return (
    <div
      className="matey-chat-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${MATE_NAMES[activeMateKey]} 와의 채팅`}
      onMouseDown={handleOverlayClick}
    >
      <div className={`matey-chat-modal__panel is-${activeMateKey}`}>
        {/* ============================================
            4-1. 좌측: 메이트 선택 사이드바
        ============================================ */}
        <aside className="matey-chat-modal__side">
          <div className="matey-chat-modal__side-header">
            <span className="matey-chat-modal__side-eyebrow">메이트 선택</span>
            <h3 className="matey-chat-modal__side-title">함께할 친구를 골라봐요</h3>
          </div>
          <ul className="matey-chat-modal__mate-list">
            {MATES.map((mate) => (
              <li key={mate.key}>
                <button
                  type="button"
                  className={`matey-chat-modal__mate-item ${
                    mate.key === activeMateKey ? 'is-active' : ''
                  }`}
                  onClick={() => handleSelectMate(mate.key)}
                >
                  <span className={`matey-chat-modal__mate-avatar is-${mate.key}`}>
                    <img src={MATE_IMAGES[mate.key]} alt="" />
                  </span>
                  <span className="matey-chat-modal__mate-meta">
                    <span className="matey-chat-modal__mate-name">
                      {MATE_NAMES[mate.key]}
                    </span>
                    <span className="matey-chat-modal__mate-role">
                      {MATE_ROLES[mate.key]}
                    </span>
                  </span>
                  {mate.key === activeMateKey && (
                    <span className="matey-chat-modal__mate-dot" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* ============================================
            4-2. 우측: 채팅 메인
        ============================================ */}
        <section className="matey-chat-modal__main">
          {/* 상단 헤더 */}
          <header className="matey-chat-modal__header">
            <div className="matey-chat-modal__header-info">
              <span className={`matey-chat-modal__header-avatar is-${activeMate.key}`}>
                <img src={MATE_IMAGES[activeMate.key]} alt="" />
              </span>
              <div>
                <p className="matey-chat-modal__header-name">
                  {MATE_NAMES[activeMate.key]}
                </p>
                <p className="matey-chat-modal__header-status">
                  <span className="matey-chat-modal__status-dot" />
                  지금 온라인 · {MATE_ROLES[activeMate.key]}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="matey-chat-modal__close"
              onClick={closeChat}
              aria-label="채팅 닫기"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          {/* 메시지 영역 */}
          <div className="matey-chat-modal__messages" ref={scrollRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`matey-chat-modal__row is-${m.role}`}
              >
                {m.role === 'mate' && (
                  <span className={`matey-chat-modal__row-avatar is-${activeMate.key}`}>
                    <img src={MATE_IMAGES[activeMate.key]} alt="" />
                  </span>
                )}
                <div
                  className={`matey-chat-modal__bubble is-${m.role} ${
                    m.role === 'mate' ? `is-${activeMate.key}` : ''
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="matey-chat-modal__row is-mate">
                <span className={`matey-chat-modal__row-avatar is-${activeMate.key}`}>
                  <img src={MATE_IMAGES[activeMate.key]} alt="" />
                </span>
                <div className="matey-chat-modal__bubble is-mate is-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {/* 인풋 영역 */}
          <form className="matey-chat-modal__input-bar" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`${MATE_NAMES[activeMate.key]}에게 한 줄 보내보기…`}
              className="matey-chat-modal__input"
              maxLength={300}
            />
            <button
              type="submit"
              className="matey-chat-modal__send"
              disabled={!inputValue.trim()}
              aria-label="전송"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M3.4 11.3 20.5 4.2c.7-.3 1.4.4 1.1 1.1L14.7 22.4c-.3.7-1.3.7-1.6-.1l-2.7-7-7-2.7c-.8-.3-.8-1.3-.1-1.6Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default ChatModal;
