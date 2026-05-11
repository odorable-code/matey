/**
 * =========================================================
 * 파일명 : src/components/15_ChatModal/ChatModal.jsx
 * 역할   : 카톡 데스크탑 스타일 채팅 모달
 * =========================================================
 *
 * [이 파일에서 하는 일]
 * - 좌측 사이드바 : 채팅방 목록 + 하단 "새 대화 시작" 버튼
 * - 우측 메인     : 빈 상태 / 채팅방 / 봇 고르기(게임 픽 톤)
 *
 * [이번 수정 핵심]
 * - 큰 캐릭터의 이름/역할을 캐릭터 위쪽으로 이동
 *   → 게임 캐릭터 ID 띠 느낌 (이름 알약 + 역할 라벨)
 *   → 이름이 캐릭터 이미지에 가려지지 않도록 z-index 분리
 * - 우측 4명 카드 구조를 위/아래로 정리
 *   → 상단: 캐릭터 + 이름/역할
 *   → 하단: 능력치 막대 (카드 폭 전체 사용)
 *
 * [여기서 주로 수정하면 되는 곳]
 * 1) COPY              : 화면 카피 모음
 * 2) SAMPLE_REPLIES    : 메이트별 샘플 답변
 * 3) PickView          : 봇 고르기 화면
 * 4) ChatView          : 1:1 채팅방
 * =========================================================
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useChatModal } from "../../contexts/ChatModalContext";
import {
  MATES,
  MATE_IMAGES,
  MATE_NAMES,
  MATE_ROLES,
  ABILITY_AXES,
} from "../../constants/mates";
import "./ChatModal.css";

/* =========================================================
   카피 / 샘플 응답 설정 코드
========================================================= */
const COPY = {
  sidebarTitle: "나의 대화",
  newButton: "+  새 대화 시작",
  emptyHelloTitle: "왼쪽에서 대화방을 골라주세요",
  emptyHelloDesc:
    "진행 중인 대화에 다시 들어가거나, 아래 버튼으로 새 친구를 만나봐요.",
  pickEyebrow: "CHARACTER PICK · 메이트 고르기",
  pickTitle: "오늘 너의 마음을 들어줄 친구는?",
  pickDesc:
    "4명의 메이트는 능력치가 달라요. 마음에 드는 친구를 골라 대화를 시작해보세요.",
  pickButton: "이 친구로 시작",
  pickIdleTitle: "메이트를 골라주세요",
  pickIdleHint: "오른쪽 카드를 누르면 미리 볼 수 있어요.",
  pickCtaNeedSelect: "먼저 친구를 골라주세요",
  pickIdleChartHint: "카드를 선택하면 능력치 차트가 표시돼요.",
  chatPlaceholder: "한 줄이면 충분해요…",
  sessionNoMate: "메이트 미지정",
};

const SAMPLE_REPLIES = {
  dog: [
    "음, 그 마음 충분히 이해돼요.",
    "오늘 하루 어땠는지 같이 짚어볼까요?",
    "괜찮아요, 천천히 말해도 돼요.",
  ],
  bear: [
    "하나씩 풀어볼게요. 가장 신경 쓰이는 게 뭐예요?",
    "생각의 흐름을 정리해볼까요?",
    "천천히, 같이 봐요.",
  ],
  cat: [
    "핵심부터 정리하면 이래요.",
    "가장 중요한 건 한 가지일 거예요.",
    "뭐부터 짚어드릴까요?",
  ],
  hamster: [
    "괜찮아요, 곁에 있어요.",
    "천천히, 한 줄이면 충분해요.",
    "말 안 해도 돼요. 그냥 와줘서 고마워요.",
  ],
};

/* =========================================================
   시간 포맷 헬퍼 코드
========================================================= */
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / (1000 * 60));
  const hour = Math.floor(diff / (1000 * 60 * 60));
  const day = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  if (hour < 24) return `${hour}시간 전`;
  if (day < 7) return `${day}일 전`;
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function nowTimeString() {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${hh}:${m}`;
}

/* =========================================================
   메인 모달 컴포넌트 코드
   - 좌측 사이드바 + 우측 동적 영역
========================================================= */
function MateBridge({ mateKey }) {
  if (!mateKey) return null;
  const mate = MATES.find((m) => m.key === mateKey);
  if (!mate) return null;
  return (
    <div className={`matey-chat-bridge ${mate.accent}`} aria-hidden="true">
      <div className="matey-chat-bridge__stage">
        <img src={MATE_IMAGES[mateKey]} alt="" className="matey-chat-bridge__img" />
      </div>
      <div className="matey-chat-bridge__meta">
        <p className="matey-chat-bridge__label">{MATE_NAMES[mateKey]}</p>
        <p className="matey-chat-bridge__role">{MATE_ROLES[mateKey]}</p>
      </div>
    </div>
  );
}

function ChatModal() {
  const {
    isOpen,
    rightView,
    RIGHT,
    closeChat,
    activeSession,
    activeSessionId,
    exitChatToList,
  } = useChatModal();

  const [narrow, setNarrow] = useState(false);
  const [mobileListHidden, setMobileListHidden] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (narrow && rightView === RIGHT.CHAT && activeSessionId) {
      setMobileListHidden(true);
    }
    if (!narrow) setMobileListHidden(false);
  }, [narrow, rightView, activeSessionId]);

  /* ---------------------------------------------
     오버레이 클릭 시 닫기 처리
  --------------------------------------------- */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeChat();
  };

  const isChat = rightView === RIGHT.CHAT && activeSession;
  const threeCol = Boolean(isChat && !narrow);
  const hideSidebar = Boolean(isChat && narrow && mobileListHidden);

  const panelClass = [
    "matey-chat-modal__panel",
    threeCol ? "matey-chat-modal__panel--three-col" : "",
    hideSidebar ? "matey-chat-modal__panel--mobile-chat" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleMobileBack = () => {
    setMobileListHidden(false);
    exitChatToList();
  };

  if (!isOpen) return null;

  return (
    <div
      className="matey-chat-modal"
      role="dialog"
      aria-modal="true"
      aria-label="메이트 채팅"
      onMouseDown={handleOverlayClick}
    >
      <div className={panelClass}>
        {/* 닫기 버튼 (공통) */}
        <button
          type="button"
          className="matey-chat-modal__close-floating"
          onClick={closeChat}
          aria-label="채팅 닫기"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {!hideSidebar ? <Sidebar /> : null}

        {threeCol && activeSession ? (
          <MateBridge mateKey={activeSession.mateKey} />
        ) : null}

        {/* 우측 메인 (상태별 분기) */}
        <main className="matey-chat-modal__main">
          {rightView === RIGHT.EMPTY && <EmptyView />}
          {rightView === RIGHT.CHAT && (
            <ChatView mobileBar={hideSidebar} onMobileBack={handleMobileBack} />
          )}
          {rightView === RIGHT.PICK && <PickView />}
        </main>
      </div>
    </div>
  );
}

export default ChatModal;

/* =========================================================
   좌측 사이드바 — 채팅방 목록 코드
========================================================= */
function Sidebar() {
  const { sessions, activeSessionId, openSession, deleteSession, showPick } =
    useChatModal();

  return (
    <aside className="matey-chat-side">
      <header className="matey-chat-side__header">
        <h2 className="matey-chat-side__title">{COPY.sidebarTitle}</h2>
        <p className="matey-chat-side__count">{sessions.length}개의 대화</p>
      </header>

      <div className="matey-chat-side__scroll">
        {sessions.length === 0 ? (
          <div className="matey-chat-side__empty">
            <p>아직 대화가 없어요</p>
            <span>아래 버튼으로 새 친구와 시작해봐요</span>
          </div>
        ) : (
          <ul className="matey-chat-side__list">
            {sessions.map((s) => {
              const mate = s.mateKey
                ? MATES.find((m) => m.key === s.mateKey)
                : null;
              const lastMsg = s.messages[s.messages.length - 1];
              const preview = lastMsg
                ? `${lastMsg.role === "user" ? "나: " : ""}${lastMsg.text}`
                : "아직 첫 메시지를 기다려요.";
              const active = s.id === activeSessionId;

              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`matey-chat-side__room ${
                      mate ? mate.accent : "is-unassigned"
                    } ${active ? "is-active" : ""}`}
                    onClick={() => openSession(s.id)}
                  >
                    <span className="matey-chat-side__avatar">
                      {mate ? (
                        <img src={MATE_IMAGES[mate.key]} alt="" />
                      ) : (
                        <span className="matey-chat-side__avatar-fallback" aria-hidden>
                          ···
                        </span>
                      )}
                    </span>

                    <span className="matey-chat-side__body">
                      <span className="matey-chat-side__top">
                        <span className="matey-chat-side__name">
                          {mate ? MATE_NAMES[mate.key] : COPY.sessionNoMate}
                        </span>
                        <span className="matey-chat-side__time">
                          {timeAgo(s.updatedAt)}
                        </span>
                      </span>
                      <span className="matey-chat-side__preview">
                        {preview}
                      </span>
                    </span>

                    {s.unread > 0 && (
                      <span className="matey-chat-side__unread">
                        {s.unread}
                      </span>
                    )}

                    <span
                      className="matey-chat-side__delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(s.id);
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="대화 삭제"
                    >
                      ×
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 항상 보이는 새 대화 버튼 */}
      <div className="matey-chat-side__cta-wrap">
        <button
          type="button"
          className="matey-chat-side__cta"
          onClick={showPick}
        >
          {COPY.newButton}
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   우측 빈 상태 화면 코드
========================================================= */
function EmptyView() {
  const { showPick } = useChatModal();

  return (
    <div className="matey-chat-empty">
      <div className="matey-chat-empty__mascots">
        {MATES.map((m, idx) => (
          <span
            key={m.key}
            className={`matey-chat-empty__mascot ${m.accent}`}
            style={{ animationDelay: `${idx * 0.12}s` }}
          >
            <img src={MATE_IMAGES[m.key]} alt="" />
          </span>
        ))}
      </div>

      <h3 className="matey-chat-empty__title">{COPY.emptyHelloTitle}</h3>
      <p className="matey-chat-empty__desc">{COPY.emptyHelloDesc}</p>

      <button
        type="button"
        className="matey-chat-empty__cta"
        onClick={showPick}
      >
        새 친구 만나러 가기 →
      </button>
    </div>
  );
}

/* =========================================================
   우측 봇 고르기 화면 (게임 캐릭터 픽 톤)
   - 좌측 큰 캐릭터 + 레이더 차트
   - 우측 4명 카드 그리드 (능력치 막대)
========================================================= */
function PickView() {
  const { startNewSession, showEmpty } = useChatModal();
  const [activeKey, setActiveKey] = useState(null);

  const activeMate = useMemo(
    () => (activeKey ? MATES.find((m) => m.key === activeKey) : null),
    [activeKey],
  );

  return (
    <div className="matey-chat-pick">
      {/* ---------- 헤더 ---------- */}
      <header className="matey-chat-pick__header">
        <span className="matey-chat-pick__eyebrow">{COPY.pickEyebrow}</span>
        <h2 className="matey-chat-pick__title">{COPY.pickTitle}</h2>
        <p className="matey-chat-pick__desc">{COPY.pickDesc}</p>

        <button
          type="button"
          className="matey-chat-pick__skip"
          onClick={showEmpty}
        >
          나중에 할게요
        </button>
      </header>

      <div className="matey-chat-pick__layout">
        {/* ---------- 좌측: 큰 캐릭터 + 레이더 차트 ---------- */}
        <div
          className={`matey-chat-pick__hero ${
            activeMate ? activeMate.accent : "matey-chat-pick__hero--idle"
          }`}
        >
          {/* 1. 이름/역할 (맨 위) */}
          <div className="matey-chat-pick__hero-meta">
            {activeMate ? (
              <>
                <p className="matey-chat-pick__hero-name">
                  {MATE_NAMES[activeMate.key]}
                </p>
                <p className="matey-chat-pick__hero-role">
                  {MATE_ROLES[activeMate.key]}
                </p>
              </>
            ) : (
              <>
                <p className="matey-chat-pick__hero-name matey-chat-pick__hero-name--idle">
                  {COPY.pickIdleTitle}
                </p>
                <p className="matey-chat-pick__hero-role">{COPY.pickIdleHint}</p>
              </>
            )}
          </div>

          {activeMate ? (
            <>
              {/* 2. 한마디 말풍선 — 캐릭터 머리 위 */}
              <p className="matey-chat-pick__hero-bubble" key={activeMate.key}>
                {activeMate.bubble}
              </p>

              {/* 3. 캐릭터 무대 */}
              <div className="matey-chat-pick__hero-stage">
                <div className="matey-chat-pick__hero-halo" />
                <img
                  key={activeMate.key}
                  src={MATE_IMAGES[activeMate.key]}
                  alt={MATE_NAMES[activeMate.key]}
                  className="matey-chat-pick__hero-image"
                />
              </div>

              {/* 4. 레이더 차트 (픽 화면 전용 소형) */}
              <RadarChart abilities={activeMate.abilities} size={168} />
            </>
          ) : (
            <>
              <div className="matey-chat-pick__hero-stage matey-chat-pick__hero-stage--idle">
                <div className="matey-chat-pick__hero-placeholder" aria-hidden="true">
                  ?
                </div>
              </div>
              <div className="matey-chat-pick__idle-chart-hint">{COPY.pickIdleChartHint}</div>
            </>
          )}

          {/* 5. 시작 버튼 (항상 맨 아래) */}
          <button
            type="button"
            className="matey-chat-pick__hero-cta"
            disabled={!activeMate}
            onClick={() => activeMate && startNewSession(activeMate.key)}
          >
            {activeMate ? `${COPY.pickButton} →` : COPY.pickCtaNeedSelect}
          </button>
        </div>

        {/* ---------- 우측: 4명 카드 그리드 ---------- */}
        <ul className="matey-chat-pick__grid">
          {MATES.map((mate) => (
            <li key={mate.key}>
              <button
                type="button"
                className={`matey-chat-pick__card ${mate.accent} ${
                  activeKey === mate.key ? "is-active" : ""
                }`}
                onClick={() => setActiveKey(mate.key)}
                onDoubleClick={() => startNewSession(mate.key)}
              >
                {mate.isRecommended && (
                  <span className="matey-chat-pick__badge">처음이라면</span>
                )}

                {/* 카드 상단: 캐릭터 + 이름/역할 */}
                <div className="matey-chat-pick__card-top">
                  <div className="matey-chat-pick__card-stage">
                    <img src={MATE_IMAGES[mate.key]} alt="" />
                  </div>

                  <div className="matey-chat-pick__card-meta">
                    <p className="matey-chat-pick__card-name">
                      {MATE_NAMES[mate.key]}
                    </p>
                    <p className="matey-chat-pick__card-role">
                      {MATE_ROLES[mate.key]}
                    </p>
                  </div>
                </div>

                {/* 카드 하단: 능력치 막대 (카드 폭 전체) */}
                <AbilityBars abilities={mate.abilities} compact />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* =========================================================
   능력치 막대 그래프 컴포넌트 코드
========================================================= */
function AbilityBars({ abilities, compact = false }) {
  return (
    <ul className={`matey-ability-bars ${compact ? "is-compact" : ""}`}>
      {ABILITY_AXES.map((axis) => {
        const value = abilities[axis.key] ?? 0;
        return (
          <li key={axis.key} className="matey-ability-bars__item">
            <div className="matey-ability-bars__row">
              <span className="matey-ability-bars__label">{axis.label}</span>
              <span className="matey-ability-bars__value">{value}</span>
            </div>
            <div className="matey-ability-bars__track">
              <div
                className="matey-ability-bars__fill"
                style={{
                  width: `${value}%`,
                  background: `linear-gradient(90deg, ${axis.color}, ${axis.color}cc)`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* =========================================================
   SVG 레이더 차트 컴포넌트 코드
========================================================= */
function RadarChart({ abilities, size = 220 }) {
  const compact = size <= 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - (compact ? 22 : 28);
  const labelR = radius + (compact ? 10 : 14);
  const labelFont = compact ? 9 : 11;
  const dotR = compact ? 3 : 4;
  const axes = ABILITY_AXES;

  // 각 축의 좌표 계산 (위에서부터 시계방향)
  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    const r = (radius * value) / 100;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  };

  // 데이터 폴리곤
  const points = axes
    .map((axis, idx) => {
      const p = getPoint(idx, abilities[axis.key] ?? 0);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  // 배경 가이드 링 (4단계)
  const ringSteps = [25, 50, 75, 100];

  // 라벨 위치 (축 끝보다 살짝 바깥)
  const getLabelPoint = (index) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * labelR,
      y: cy + Math.sin(angle) * labelR,
    };
  };

  return (
    <div className="matey-radar">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        {/* 가이드 링 */}
        {ringSteps.map((step) => {
          const pts = axes
            .map((_, idx) => {
              const p = getPoint(idx, step);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={step}
              points={pts}
              fill="none"
              stroke="#e6e0f5"
              strokeWidth="1"
            />
          );
        })}

        {/* 축 라인 */}
        {axes.map((axis, idx) => {
          const p = getPoint(idx, 100);
          return (
            <line
              key={axis.key}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#ece6f8"
              strokeWidth="1"
            />
          );
        })}

        {/* 데이터 폴리곤 */}
        <polygon
          points={points}
          fill="url(#matey-radar-gradient)"
          stroke="#8f79ff"
          strokeWidth="2"
        />

        {/* 데이터 점 */}
        {axes.map((axis, idx) => {
          const p = getPoint(idx, abilities[axis.key] ?? 0);
          return (
            <circle
              key={axis.key}
              cx={p.x}
              cy={p.y}
              r={dotR}
              fill="#ffffff"
              stroke={axis.color}
              strokeWidth="2"
            />
          );
        })}

        {/* 라벨 */}
        {axes.map((axis, idx) => {
          const lp = getLabelPoint(idx);
          return (
            <text
              key={axis.key}
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={labelFont}
              fontWeight="800"
              fill={axis.color}
            >
              {axis.label}
            </text>
          );
        })}

        <defs>
          <linearGradient id="matey-radar-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8f79ff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6ebeff" stopOpacity="0.25" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* =========================================================
   우측 채팅방 화면 코드
========================================================= */
function ChatView({ mobileBar = false, onMobileBack }) {
  const { activeSession, appendMessage } = useChatModal();
  const mate = useMemo(() => {
    if (!activeSession) return null;
    return MATES.find((m) => m.key === activeSession.mateKey);
  }, [activeSession]);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  /* ---------------------------------------------
     방 진입 시 인풋 포커스 (인사 말풍선은 넣지 않음 — 사용자가 먼저 말을 걸 때까지 대화창 비움)
  --------------------------------------------- */
  useEffect(() => {
    if (!activeSession || !mate) return;
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [activeSession?.id, mate]);

  /* ---------------------------------------------
     메시지 변경 시 스크롤 하단으로
  --------------------------------------------- */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeSession?.messages, isTyping]);

  if (!activeSession || !mate) return null;

  /* ---------------------------------------------
     메시지 전송 처리
  --------------------------------------------- */
  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage(activeSession.id, {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      time: nowTimeString(),
    });
    setInputValue("");
    setIsTyping(true);

    const replies = SAMPLE_REPLIES[mate.key] ?? ["천천히 들려줘요."];
    const reply = replies[Math.floor(Math.random() * replies.length)];

    setTimeout(() => {
      appendMessage(activeSession.id, {
        id: `mate-${Date.now()}`,
        role: "mate",
        text: reply,
        time: nowTimeString(),
      });
      setIsTyping(false);
    }, 900);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const showChips = activeSession.messages.length === 0;

  return (
    <div className={`matey-chat-room ${mate.accent}`}>
      {mobileBar ? (
        <div className="matey-chat-room__mobile-nav">
          <button
            type="button"
            className="matey-chat-room__mobile-back"
            onClick={onMobileBack}
          >
            ← 대화 목록
          </button>
          <div className="matey-chat-room__mobile-float" aria-hidden="true">
            <img src={MATE_IMAGES[mate.key]} alt="" />
          </div>
        </div>
      ) : null}
      {/* 헤더 */}
      <header className="matey-chat-room__header">
        <div className="matey-chat-room__header-info">
          <span className="matey-chat-room__avatar">
            <img src={MATE_IMAGES[mate.key]} alt="" />
          </span>
          <div className="matey-chat-room__header-text">
            <p className="matey-chat-room__name">{MATE_NAMES[mate.key]}</p>
            <p className="matey-chat-room__status">
              <span className="matey-chat-room__status-dot" />
              지금 온라인 · {MATE_ROLES[mate.key]}
            </p>
          </div>
        </div>
      </header>

      {/* 메시지 영역 */}
      <div className="matey-chat-room__messages" ref={scrollRef}>
        {activeSession.messages.map((m) => (
          <div key={m.id} className={`matey-chat-room__row is-${m.role}`}>
            {m.role === "mate" && (
              <span className="matey-chat-room__row-avatar">
                <img src={MATE_IMAGES[mate.key]} alt="" />
              </span>
            )}
            <div className="matey-chat-room__bubble-wrap">
              <div className={`matey-chat-room__bubble is-${m.role}`}>
                {m.text}
              </div>
              <span className="matey-chat-room__time">{m.time}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="matey-chat-room__row is-mate">
            <span className="matey-chat-room__row-avatar">
              <img src={MATE_IMAGES[mate.key]} alt="" />
            </span>
            <div className="matey-chat-room__bubble is-mate is-typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {/* 빠른 시작 칩 (인사 직후에만) */}
      {showChips && (
        <div className="matey-chat-room__chips">
          {mate.quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="matey-chat-room__chip"
              onClick={() => sendMessage(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* 인풋 영역 */}
      <form className="matey-chat-room__input-bar" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={COPY.chatPlaceholder}
          className="matey-chat-room__input"
          maxLength={300}
        />
        <button
          type="submit"
          className="matey-chat-room__send"
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
    </div>
  );
}
