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
import { mergeLandingBotsRows } from 'utils/landingMates';
import { communityAPI, myPageAPI, chatRoomAPI } from 'utils/api';
import { resolveMateKey } from '../constants/mates';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
  const currentUserId = user?.userId ?? user?.id ?? null;

  const [isOpen, setIsOpen] = useState(false);
  const [rightView, setRightView] = useState(RIGHT.EMPTY);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [archivedSessions, setArchivedSessions] = useState([]);
  const [landingMates, setLandingMates] = useState(() => mergeLandingBotsRows([]));
  /** 담당봇 bot-menu: 채팅은 친밀 레벨로 해금된 모션만, 맥락에 맞게 선택 */
  const [assignedBotMotionsForChat, setAssignedBotMotionsForChat] = useState(null);

  // 로그인 유저가 바뀔 때만 세션 전체 초기화 (다른 계정 재로그인 시 데이터 혼용 방지)
  useEffect(() => {
    setSessions([]);
    setArchivedSessions([]);
    setActiveSessionId(null);
    setRightView(RIGHT.EMPTY);
  }, [currentUserId]);

  // 모달 닫힐 때 활성 세션만 초기화 (지난대화는 유지)
  useEffect(() => {
    if (!isOpen) {
      setSessions([]);
      setActiveSessionId(null);
      setRightView(RIGHT.EMPTY);
    }
  }, [isOpen]);

  // 모달 열릴 때 DB에서 채팅방 목록 로드
  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    chatRoomAPI
      .getRooms()
      .then((rooms) => {
        if (cancelled || !Array.isArray(rooms)) return;
        // 클라이언트에서도 ARCHIVED 방 이중 필터
        const activeRooms = rooms.filter((r) => r.status !== 'ARCHIVED');
        setSessions((prev) => {
          const keptIds = new Set(prev.map((s) => String(s.chatRoomId)));
          const newFromDb = activeRooms
            .filter((r) => !keptIds.has(String(r.chatRoomId)))
            .map((r) => ({
              id: `db-${r.chatRoomId}`,
              chatRoomId: r.chatRoomId,
              mateKey: resolveMateKey(r.mateKey ?? '') || r.mateKey,
              title: r.title || '대화',
              lastMessage: r.lastMessage || '',
              createdAt: r.lastMessageAt ? new Date(r.lastMessageAt).getTime() : Date.now(),
              updatedAt: r.lastMessageAt ? new Date(r.lastMessageAt).getTime() : Date.now(),
              unread: 0,
              messages: [],
              loadedFromDb: true,
            }));
          return [...prev, ...newFromDb].sort((a, b) => b.updatedAt - a.updatedAt);
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    myPageAPI
      .getBotMenu()
      .then((menu) => {
        if (cancelled || !menu) return;
        const mk = resolveMateKey(menu.botName ?? menu.bot_name ?? '');
        if (!mk) {
          setAssignedBotMotionsForChat(null);
          return;
        }
        const motions = menu.motions ?? menu.motions_list ?? [];
        const lv = Number(menu.level);
        const intimacyLevel = Number.isFinite(lv) && lv >= 0 ? lv : 0;
        setAssignedBotMotionsForChat({
          mateKey: mk,
          intimacyLevel,
          motions: Array.isArray(motions) ? motions : [],
        });
      })
      .catch(() => {
        if (!cancelled) setAssignedBotMotionsForChat(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;
    communityAPI
      .getLandingBots()
      .then((rows) => {
        if (cancelled) return;
        setLandingMates(mergeLandingBotsRows(Array.isArray(rows) ? rows : []));
      })
      .catch(() => {
        if (!cancelled) setLandingMates(mergeLandingBotsRows([]));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // -------- 모달 열기 --------
  // mateKey 주면 즉시 새 세션 만들고 채팅 시작
  // 없으면 메이트 고르기(PICK) — 빈 안내 화면 대신 바로 선택 UI
  const openChat = useCallback((mateKey = null) => {
    const normalized =
      mateKey != null && String(mateKey).trim() !== ''
        ? String(mateKey).trim().toLowerCase()
        : null;
    if (normalized) {
      const id = `s-${Date.now()}`;
      setSessions((prev) => [
        {
          id,
          chatRoomId: null,
          mateKey: normalized,
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

      chatRoomAPI
        .createRoom(normalized, '새로운 대화')
        .then((data) => {
          if (!data?.chatRoomId) return;
          setSessions((prev) =>
            prev.map((s) =>
              s.id === id ? { ...s, chatRoomId: data.chatRoomId } : s,
            ),
          );
        })
        .catch(() => {});
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
    const normalized =
      mateKey != null && String(mateKey).trim() !== ''
        ? String(mateKey).trim().toLowerCase()
        : null;
    if (!normalized) return;
    const id = `s-${Date.now()}`;
    const newSession = {
      id,
      chatRoomId: null, // DB 저장 후 채워짐
      mateKey: normalized,
      title: '새로운 대화',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      unread: 0,
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(id);
    setRightView(RIGHT.CHAT);

    // DB에 채팅방 생성 (비동기, 실패해도 UI는 유지)
    chatRoomAPI
      .createRoom(normalized, '새로운 대화')
      .then((data) => {
        if (!data?.chatRoomId) return;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, chatRoomId: data.chatRoomId } : s,
          ),
        );
      })
      .catch(() => {});
  }, []);

  // -------- 기존 방 열기 --------
  const openSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId);

    const loadMessages = (chatRoomId, updateFn) => {
      chatRoomAPI
        .getMessages(chatRoomId)
        .then((msgs) => {
          if (!Array.isArray(msgs) || msgs.length === 0) return;
          const mapped = msgs
            .slice()
            .sort((a, b) => {
              const t = new Date(a.createdAt) - new Date(b.createdAt);
              // 같은 초(초 단위 타임스탬프) 메시지는 messageId(삽입 순서)로 정렬
              return t !== 0 ? t : (a.messageId ?? 0) - (b.messageId ?? 0);
            })
            .map((m) => ({
              id: `db-msg-${m.messageId}`,
              role: m.senderType === 'USER' ? 'user' : 'mate',
              text: m.content,
              time: m.createdAt
                ? (() => {
                    const d = new Date(m.createdAt);
                    const h = d.getHours();
                    const mi = d.getMinutes().toString().padStart(2, '0');
                    const p = h < 12 ? '오전' : '오후';
                    return `${p} ${h % 12 === 0 ? 12 : h % 12}:${mi}`;
                  })()
                : '',
            }));
          updateFn(mapped);
        })
        .catch(() => {});
    };

    setSessions((prev) => {
      const session = prev.find((s) => s.id === sessionId);
      if (session?.chatRoomId && session.messages.length === 0) {
        loadMessages(session.chatRoomId, (mapped) =>
          setSessions((cur) => cur.map((s) => s.id === sessionId ? { ...s, messages: mapped } : s))
        );
      }
      return prev.map((s) => (s.id === sessionId ? { ...s, unread: 0 } : s));
    });

    // 아카이브 세션인 경우 메시지 로드
    setArchivedSessions((prev) => {
      const session = prev.find((s) => s.id === sessionId);
      if (session?.chatRoomId && session.messages.length === 0) {
        loadMessages(session.chatRoomId, (mapped) =>
          setArchivedSessions((cur) => cur.map((s) => s.id === sessionId ? { ...s, messages: mapped } : s))
        );
      }
      return prev;
    });

    setRightView(RIGHT.CHAT);
  }, []);

  // -------- 세션 삭제 --------
  const deleteSession = useCallback((sessionId) => {
    if (!sessionId) return;
    const ok = window.confirm(
      '이 대화방을 삭제할까요?\n대화 내용이 모두 사라지며 되돌릴 수 없어요.'
    );
    if (!ok) return;

    // DB soft-delete (chatRoomId 있을 때)
    setSessions((prev) => {
      const session = prev.find((s) => s.id === sessionId);
      if (session?.chatRoomId) {
        chatRoomAPI.deleteRoom(session.chatRoomId).catch(() => {});
      }
      return prev.filter((s) => s.id !== sessionId);
    });

    setActiveSessionId((prev) => {
      if (prev === sessionId) {
        setRightView(RIGHT.EMPTY);
        return null;
      }
      return prev;
    });
  }, []);

  // -------- 대화 종료 (요약 쪽지 발송 + ARCHIVED) --------
  const endSession = useCallback((sessionId) => {
    if (!sessionId) return;
    const ok = window.confirm(
      '대화를 마칠까요?\n요약 쪽지가 쪽지함에 도착할 거예요.'
    );
    if (!ok) return;

    setSessions((prev) => {
      const session = prev.find((s) => s.id === sessionId);
      if (session?.chatRoomId) {
        chatRoomAPI.endRoom(session.chatRoomId).catch(() => {});
        setArchivedSessions((arch) => {
          const alreadyIn = arch.some((a) => a.chatRoomId === session.chatRoomId);
          if (alreadyIn) return arch;
          return [{ ...session, id: `archived-${session.chatRoomId}`, status: 'ARCHIVED' }, ...arch];
        });
      }
      return prev.filter((s) => s.id !== sessionId);
    });

    setActiveSessionId((prev) => {
      if (prev === sessionId) {
        setRightView(RIGHT.EMPTY);
        return null;
      }
      return prev;
    });
  }, []);

  // -------- 메시지 추가 + DB 저장 --------
  // skipDB: true 이면 로컬 상태만 업데이트 (DB 저장은 persistUserMessage 로 분리)
  const appendMessage = useCallback((sessionId, message, { skipDB = false } = {}) => {
    setSessions((prev) => {
      const session = prev.find((s) => s.id === sessionId);

      // DB 저장 (chatRoomId 있고 db-msg가 아닌 새 메시지만, skipDB 아닐 때만)
      if (!skipDB && session?.chatRoomId && !String(message.id).startsWith('db-msg-')) {
        const senderType = message.role === 'user' ? 'USER' : 'BOT';
        chatRoomAPI
          .saveMessage(session.chatRoomId, message.text, senderType)
          .catch(() => {});
      }

      return prev.map((s) => {
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
      });
    });
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
    () =>
      sessions.find((s) => s.id === activeSessionId) ??
      archivedSessions.find((s) => s.id === activeSessionId) ??
      null,
    [sessions, archivedSessions, activeSessionId],
  );

  // 유저 메시지를 emotionCode 와 함께 DB에만 저장 (로컬 상태 변경 없음)
  const persistUserMessage = useCallback((chatRoomId, content, emotionCode = null) => {
    if (!chatRoomId) return;
    chatRoomAPI.saveMessage(chatRoomId, content, 'USER', emotionCode).catch(() => {});
  }, []);

  const loadArchivedSessions = useCallback(() => {
    chatRoomAPI.getArchivedRooms().then((rooms) => {
      if (!Array.isArray(rooms)) return;
      setArchivedSessions(
        rooms.map((r) => ({
          id: `archived-${r.chatRoomId}`,
          chatRoomId: r.chatRoomId,
          mateKey: resolveMateKey(r.mateKey ?? '') || r.mateKey,
          title: r.title || '대화',
          lastMessage: r.lastMessage || '',
          updatedAt: r.lastMessageAt ? new Date(r.lastMessageAt).getTime() : 0,
          status: 'ARCHIVED',
          messages: [],
        }))
      );
    }).catch(() => {});
  }, []);

  const value = {
    isOpen,
    rightView,
    sessions,
    archivedSessions,
    loadArchivedSessions,
    activeSession,
    activeSessionId,
    RIGHT,
    landingMates,
    assignedBotMotionsForChat,
    openChat,
    closeChat,
    showEmpty,
    exitChatToList,
    showPick,
    startNewSession,
    openSession,
    deleteSession,
    endSession,
    appendMessage,
    persistUserMessage,
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
