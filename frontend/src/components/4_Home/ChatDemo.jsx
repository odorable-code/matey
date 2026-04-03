import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './ChatDemo.css';

const SCENARIOS = [
  {
    id: 'overwhelmed',
    label: '할 일 폭주',
    title: '해야 할 일이 많아 시작이 막막한 순간',
    intro:
      '해야 할 일이 한꺼번에 몰리면 어디부터 손대야 할지 모르겠고, 마음이 먼저 무거워질 수 있어요.',
    question: '지금 가장 가까운 상태가 어떤 쪽인가요?',
    choices: [
      '할 일이 너무 많아서 어디부터 해야 할지 모르겠어요.',
      '해야 하는 건 아는데 몸이 잘 안 움직여요.',
      '딱 하나만 시작하면 될 것 같은데 그 시작이 어려워요.',
    ],
  },
  {
    id: 'mistake',
    label: '실수 후 멘붕',
    title: '실수한 뒤 계속 마음이 불편한 순간',
    intro:
      '지나간 일인데도 자꾸 떠오르고, 상대가 나를 어떻게 봤을지 생각나면 더 불안해질 수 있어요.',
    question: '지금 제일 마음에 걸리는 건 어떤 부분인가요?',
    choices: [
      '내가 너무 크게 실수한 것 같아서 계속 생각나요.',
      '상대가 나를 안 좋게 봤을까 봐 불안해요.',
      '이미 지나간 일인데도 그 장면이 자꾸 떠올라요.',
    ],
  },
  {
    id: 'night',
    label: '밤 감정 정리',
    title: '밤이 되면 생각이 많아지는 순간',
    intro:
      '밤에는 낮보다 감정이 더 크게 느껴지고, 별일 아닌 것 같던 일도 오래 남아 있을 수 있어요.',
    question: '지금 이 순간 가장 크게 느껴지는 감정은 무엇인가요?',
    choices: [
      '괜히 불안하고 마음이 쉽게 가라앉지 않아요.',
      '오늘 있었던 일들이 머릿속에서 계속 반복돼요.',
      '정확한 이유는 모르겠는데 그냥 많이 지쳐 있어요.',
    ],
  },
];

const CHARACTERS = {
  rabbit: {
    id: 'rabbit',
    name: '하루',
    role: '차분하게 정리해주는 메이트',
    image: '/images/rabbit.png',
    tone: 'blue',
  },
  cat: {
    id: 'cat',
    name: '루미',
    role: '다정하게 먼저 다가오는 메이트',
    image: '/images/cat.png',
    tone: 'pink',
  },
};

const REPLIES = {
  overwhelmed: {
    rabbit: [
      '그럴 땐 전체를 한 번에 보지 말고, 10분 안에 끝낼 수 있는 가장 작은 일 하나만 먼저 골라보는 게 좋아요. 지금 같이 하나만 정해볼까요?',
      '몸이 안 움직일 때는 의지가 부족해서가 아니라 에너지가 바닥난 경우가 많아요. 우선 시작 기준을 아주 작게 낮춰볼게요.',
      '좋아요. 그 첫 시작을 더 작게 쪼개면 훨씬 쉬워져요. 파일 열기, 제목 쓰기처럼 정말 작은 단계부터 같이 잡아볼까요?',
    ],
    cat: [
      '해야 할 일이 많으면 마음이 먼저 눌릴 수 있어요. 지금은 전부 하려 하지 말고 가장 가벼운 것 하나만 같이 골라봐요.',
      '그럴 수 있어요. 억지로 몰아붙이기보다 시작 장벽을 낮추는 게 먼저예요. 제가 한 단계씩 같이 정리해드릴게요.',
      '완벽하게 시작하려 해서 더 어려운 걸 수도 있어요. 아주 작고 만만한 첫 단계부터 같이 만들어봐요.',
    ],
  },
  mistake: {
    rabbit: [
      '실수 자체보다 그 장면이 계속 반복되는 게 더 힘들 수 있어요. 우선 사실과 내가 붙인 해석을 분리해서 정리해볼까요?',
      '상대 반응이 걱정될 수 있지만, 지금 할 수 있는 후속 대응은 분명 있어요. 필요한 문장부터 같이 정리해볼게요.',
      '지나간 일일수록 머릿속에서 더 커 보일 때가 있어요. 지금 가장 불편한 포인트 하나만 먼저 꺼내봐도 괜찮아요.',
    ],
    cat: [
      '그 일 때문에 마음이 꽤 오래 머물러 있었구나. 너무 자연스러운 반응이에요. 우선 나를 너무 세게 혼내지 않았으면 해요.',
      '상대 시선이 걱정될 수 있어요. 그래도 지금은 내가 바로잡을 수 있는 부분부터 같이 챙겨보면 조금 덜 불안해질 수 있어요.',
      '이미 지난 일인데 자꾸 떠오르면 마음이 아직 정리가 덜 된 거예요. 천천히 같이 정리해봐도 괜찮아요.',
    ],
  },
  night: {
    rabbit: [
      '불안이 올라올 땐 생각을 멈추려 하기보다, 지금 머릿속을 짧게 밖으로 꺼내는 게 더 도움이 될 수 있어요. 한 줄씩 같이 적어볼까요?',
      '오늘 일이 반복해서 떠오르는 건 마음이 아직 마무리되지 않았다는 신호일 수 있어요. 지금 제일 크게 남은 장면부터 정리해볼게요.',
      '이유 없는 지침처럼 보여도 몸과 마음이 동시에 피곤했을 수 있어요. 오늘은 해석보다 회복에 조금 더 초점을 맞춰볼까요?',
    ],
    cat: [
      '밤에는 감정이 더 크게 느껴질 수 있어요. 지금 불안한 내가 이상한 게 아니에요. 우선 숨을 조금만 느리게 쉬어봐도 좋아요.',
      '오늘 있었던 일이 계속 맴도는구나. 머리 안에서만 돌리지 말고 내가 옆에서 천천히 같이 정리해줄게요.',
      '이유를 꼭 바로 찾지 않아도 괜찮아요. 그냥 많이 지쳐 있는 상태 자체를 먼저 인정해도 충분해요.',
    ],
  },
};

const BASE_BUBBLE_BOTTOM = 250;
const BASE_REPLY_BOTTOM = 148;
const GAP_ABOVE_CHARACTER = 22;
const GAP_BETWEEN_STACK_AND_BUBBLE = 30;
const PANEL_TOP_SAFE = 20;

function buildInitialMessage(scenario, character) {
  if (character.id === 'rabbit') {
    return `천천히 괜찮아요. ${scenario.question}`;
  }
  return `완벽하게 말하지 않아도 괜찮아요. ${scenario.question}`;
}

function getScenarioTheme(scenarioId) {
  if (scenarioId === 'night') return 'night';
  if (scenarioId === 'mistake') return 'warm';
  return 'focus';
}

function getExpressionLabel(scenarioId, isResponding, characterId) {
  if (isResponding) return '생각 정리 중';

  if (scenarioId === 'overwhelmed') {
    return characterId === 'rabbit' ? '집중 정리 모드' : '가볍게 시작해볼까요';
  }

  if (scenarioId === 'mistake') {
    return characterId === 'rabbit' ? '차분히 정리해볼게요' : '괜찮다고 먼저 말해줄게요';
  }

  return characterId === 'rabbit' ? '조용히 호흡 맞추는 중' : '밤에 더 다정한 톤';
}

function ChatDemo() {
  const replyTimerRef = useRef(null);
  const hoverCloseTimerRef = useRef(null);

  const zoneRef = useRef(null);
  const speechBubbleRef = useRef(null);
  const replyStackRef = useRef(null);
  const companionRef = useRef(null);

  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [characterId, setCharacterId] = useState('rabbit');
  const [assistantMessage, setAssistantMessage] = useState(
    buildInitialMessage(SCENARIOS[0], CHARACTERS.rabbit)
  );
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [messageKey, setMessageKey] = useState(0);
  const [layoutVars, setLayoutVars] = useState({
    bubbleLift: 0,
    replyBottom: BASE_REPLY_BOTTOM,
  });

  const activeScenario = useMemo(
    () => SCENARIOS.find((item) => item.id === scenarioId) || SCENARIOS[0],
    [scenarioId]
  );

  const activeCharacter = useMemo(
    () => CHARACTERS[characterId] || CHARACTERS.rabbit,
    [characterId]
  );

  const scenarioTheme = useMemo(() => getScenarioTheme(scenarioId), [scenarioId]);

  const isPanelOpen = !isResponding && isHoverOpen;

  const resetDynamicLayout = useCallback(() => {
    setLayoutVars({
      bubbleLift: 0,
      replyBottom: BASE_REPLY_BOTTOM,
    });
  }, []);

  const calculateDynamicHoverLayout = useCallback(() => {
    const zoneEl = zoneRef.current;
    const bubbleEl = speechBubbleRef.current;
    const replyEl = replyStackRef.current;
    const companionEl = companionRef.current;

    if (!zoneEl || !bubbleEl || !replyEl || !companionEl) {
      resetDynamicLayout();
      return;
    }

    const zoneHeight = zoneEl.offsetHeight;
    const bubbleHeight = bubbleEl.offsetHeight;
    const replyHeight = replyEl.offsetHeight;
    const companionTop = companionEl.offsetTop;

    const minReplyBottomForCharacter =
      zoneHeight - companionTop + GAP_ABOVE_CHARACTER;

    const maxBubbleBottom = Math.max(
      BASE_BUBBLE_BOTTOM,
      zoneHeight - bubbleHeight - PANEL_TOP_SAFE
    );

    const maxReplyBottomForGap = Math.max(
      BASE_REPLY_BOTTOM,
      maxBubbleBottom - replyHeight - GAP_BETWEEN_STACK_AND_BUBBLE
    );

    let safeReplyBottom = Math.min(
      Math.max(BASE_REPLY_BOTTOM, minReplyBottomForCharacter),
      maxReplyBottomForGap
    );

    let safeBubbleBottom =
      safeReplyBottom + replyHeight + GAP_BETWEEN_STACK_AND_BUBBLE;

    if (safeBubbleBottom > maxBubbleBottom) {
      const overflow = safeBubbleBottom - maxBubbleBottom;
      safeReplyBottom = Math.max(BASE_REPLY_BOTTOM, safeReplyBottom - overflow);
      safeBubbleBottom =
        safeReplyBottom + replyHeight + GAP_BETWEEN_STACK_AND_BUBBLE;
    }

    safeBubbleBottom = Math.min(
      Math.max(BASE_BUBBLE_BOTTOM, safeBubbleBottom),
      maxBubbleBottom
    );

    const bubbleLift = Math.max(0, safeBubbleBottom - BASE_BUBBLE_BOTTOM);

    setLayoutVars({
      bubbleLift,
      replyBottom: safeReplyBottom,
    });
  }, [resetDynamicLayout]);

  useEffect(() => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);

    setAssistantMessage(buildInitialMessage(activeScenario, activeCharacter));
    setInput('');
    setIsResponding(false);
    setIsHoverOpen(false);
    setMessageKey((prev) => prev + 1);
    resetDynamicLayout();
  }, [activeScenario, activeCharacter, resetDynamicLayout]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
      if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPanelOpen) {
      resetDynamicLayout();
      return;
    }

    const raf = requestAnimationFrame(() => {
      calculateDynamicHoverLayout();
    });

    return () => cancelAnimationFrame(raf);
  }, [
    isPanelOpen,
    assistantMessage,
    input,
    activeScenario.id,
    activeCharacter.id,
    calculateDynamicHoverLayout,
    resetDynamicLayout,
  ]);

  useEffect(() => {
    const zoneEl = zoneRef.current;
    const bubbleEl = speechBubbleRef.current;
    const replyEl = replyStackRef.current;
    const companionEl = companionRef.current;

    if (
      !zoneEl ||
      !bubbleEl ||
      !replyEl ||
      !companionEl ||
      typeof ResizeObserver === 'undefined'
    ) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      if (isPanelOpen) {
        calculateDynamicHoverLayout();
      }
    });

    observer.observe(zoneEl);
    observer.observe(bubbleEl);
    observer.observe(replyEl);
    observer.observe(companionEl);

    return () => observer.disconnect();
  }, [isPanelOpen, calculateDynamicHoverLayout]);

  const openHoverPanel = () => {
    if (isResponding) return;
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
    setIsHoverOpen(true);
  };

  const closeHoverPanel = () => {
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);

    hoverCloseTimerRef.current = setTimeout(() => {
      setIsHoverOpen(false);
    }, 140);
  };

  const handleZoneBlur = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    closeHoverPanel();
  };

  const handleReply = (replyText) => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);

    setIsHoverOpen(false);
    setInput('');
    setIsResponding(true);

    replyTimerRef.current = setTimeout(() => {
      setAssistantMessage(replyText);
      setIsResponding(false);
      setMessageKey((prev) => prev + 1);
      resetDynamicLayout();
    }, 650);
  };

  const handleChoiceClick = (index) => {
    if (isResponding) return;

    const reply =
      REPLIES[activeScenario.id]?.[activeCharacter.id]?.[index] ||
      '좋아요. 지금 말해준 감정부터 차분하게 같이 정리해볼게요.';

    handleReply(reply);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isResponding) return;

    const reply =
      activeCharacter.id === 'rabbit'
        ? '좋아요. 지금 말해준 내용을 기준으로 가장 부담 없는 다음 단계부터 함께 정리해볼게요.'
        : '말해줘서 고마워요. 지금 마음이 조금 덜 무겁게 느껴지도록 가장 부드러운 방식부터 같이 찾아볼게요.';

    handleReply(reply);
  };

  return (
    <section className="matey-chat-demo" id="chat-demo">
      <div className="matey-chat-demo__inner">
        <div className="matey-chat-demo__header">
          <span className="matey-chat-demo__badge">대화 예시</span>

          <h2 className="matey-chat-demo__title">
            메이티는 이런 순간에,
            <br />
            <span>먼저 부드럽게 말을 걸어요</span>
          </h2>

          <p className="matey-chat-demo__subtitle">
            바탕화면에 머무르던 메이트가 먼저 말을 걸고, 사용자는 캐릭터 가까이에서
            가볍게 반응하듯 답하는 흐름으로 정리했어요.
          </p>
        </div>

        <div className="matey-chat-demo__controls">
          <div className="matey-chat-demo__scenario-tabs" role="tablist" aria-label="상황 선택">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                role="tab"
                aria-selected={scenarioId === scenario.id}
                className={`matey-chat-demo__scenario-tab ${
                  scenarioId === scenario.id ? 'is-active' : ''
                }`}
                onClick={() => setScenarioId(scenario.id)}
              >
                {scenario.label}
              </button>
            ))}
          </div>

          <div className="matey-chat-demo__character-tabs" aria-label="캐릭터 선택">
            {Object.values(CHARACTERS).map((character) => (
              <button
                key={character.id}
                type="button"
                className={`matey-chat-demo__character-tab ${
                  characterId === character.id ? 'is-active' : ''
                }`}
                aria-pressed={characterId === character.id}
                onClick={() => setCharacterId(character.id)}
              >
                <img src={character.image} alt={character.name} />
                <span className="matey-chat-demo__character-tab-copy">
                  <strong>{character.name}</strong>
                  <small>{character.role}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="matey-chat-demo__stage">
          <div className={`matey-chat-demo__window matey-chat-demo__window--${scenarioTheme}`}>
            <div className="matey-chat-demo__window-topbar" aria-hidden="true">
              <div className="matey-chat-demo__window-traffic">
                <span />
                <span />
                <span />
              </div>
              <div className="matey-chat-demo__window-title">Matey Visual Talk</div>
              <div className="matey-chat-demo__window-status">{activeScenario.label}</div>
            </div>

            <div className="matey-chat-demo__wallpaper" aria-hidden="true">
              <div className="matey-chat-demo__wallpaper-orb matey-chat-demo__wallpaper-orb--one" />
              <div className="matey-chat-demo__wallpaper-orb matey-chat-demo__wallpaper-orb--two" />
              <div className="matey-chat-demo__wallpaper-orb matey-chat-demo__wallpaper-orb--three" />
              <div className="matey-chat-demo__wallpaper-grid" />
            </div>

            <div className={`matey-chat-demo__scene-card ${isResponding ? 'is-fading' : ''}`}>
              <span className="matey-chat-demo__scene-chip">현재 장면</span>
              <strong className="matey-chat-demo__scene-title">{activeScenario.title}</strong>
              <p className="matey-chat-demo__scene-copy">{activeScenario.intro}</p>

              <div className="matey-chat-demo__scene-tag-list">
                <span className="matey-chat-demo__scene-tag">{activeScenario.label}</span>
                <span className="matey-chat-demo__scene-tag">{activeCharacter.role}</span>
              </div>
            </div>

            <div
              ref={zoneRef}
              className={`matey-chat-demo__companion-zone ${
                isPanelOpen ? 'is-panel-open' : ''
              }`}
              style={{
                '--matey-bubble-lift': `${layoutVars.bubbleLift}px`,
                '--matey-reply-bottom': `${layoutVars.replyBottom}px`,
              }}
              onMouseEnter={openHoverPanel}
              onMouseLeave={closeHoverPanel}
              onFocus={openHoverPanel}
              onBlur={handleZoneBlur}
            >
              <div
                ref={speechBubbleRef}
                className={`matey-chat-demo__speech-bubble ${isPanelOpen ? 'is-raised' : ''} ${
                  isResponding ? 'is-loading' : ''
                }`}
              >
                <span className="matey-chat-demo__speech-name">{activeCharacter.name}</span>

                <div className="matey-chat-demo__speech-content" aria-live="polite">
                  {isResponding ? (
                    <div className="matey-chat-demo__speech-loading" aria-label="답변 작성 중">
                      <i />
                      <i />
                      <i />
                    </div>
                  ) : (
                    <p key={messageKey}>{assistantMessage}</p>
                  )}
                </div>
              </div>

              <div
                ref={replyStackRef}
                className={`matey-chat-demo__reply-stack ${isPanelOpen ? 'is-open' : ''}`}
              >
                <div className="matey-chat-demo__choices">
                  {activeScenario.choices.map((choice, index) => (
                    <button
                      key={choice}
                      type="button"
                      className="matey-chat-demo__choice matey-chat-demo__choice--bubble"
                      onClick={() => handleChoiceClick(index)}
                      disabled={isResponding}
                    >
                      {choice}
                    </button>
                  ))}
                </div>

                <form
                  className="matey-chat-demo__input-form matey-chat-demo__input-form--stack"
                  onSubmit={handleSubmit}
                >
                  <label htmlFor="matey-chat-demo-input" className="sr-only">
                    자유롭게 답변 입력
                  </label>
                  <input
                    id="matey-chat-demo-input"
                    type="text"
                    className="matey-chat-demo__input"
                    placeholder="직접 답해도 괜찮아요"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={isResponding}
                  />
                  <button
                    type="submit"
                    className="matey-chat-demo__send"
                    disabled={isResponding || !input.trim()}
                  >
                    보내기
                  </button>
                </form>
              </div>

              <div
                ref={companionRef}
                className={`matey-chat-demo__companion is-${activeCharacter.tone} ${
                  isResponding ? 'is-responding' : ''
                }`}
              >
                <div className="matey-chat-demo__companion-aura" />
                <div className="matey-chat-demo__companion-frame">
                  <img
                    src={activeCharacter.image}
                    alt={activeCharacter.name}
                    className="matey-chat-demo__companion-image"
                  />
                </div>

                <div className="matey-chat-demo__companion-meta">
                  <strong className="matey-chat-demo__companion-name">
                    {activeCharacter.name}
                  </strong>
                  <span className="matey-chat-demo__companion-role">
                    {getExpressionLabel(activeScenario.id, isResponding, activeCharacter.id)}
                  </span>
                </div>
              </div>
            </div>

            <div className="matey-chat-demo__hover-hint">
              데스크톱에서는 캐릭터에 마우스를 올리면 답변 선택지가 열려요
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChatDemo;
