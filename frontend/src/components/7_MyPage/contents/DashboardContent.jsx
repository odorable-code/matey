import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './DashboardContent.module.css';
import useAnimatedNumber, { usePrefersReducedMotion } from '../hooks/useAnimatedNumber';

const STAGE_FADE_DURATION = 900;
const DAILY_GREETING_STORAGE_KEY = 'matey-daily-greeting-last-seen-v2';
const DAILY_GREETING_TEXT = '안녕! 오늘도 와줬네? 보고싶었어!';
const DAILY_GREETING_DURATION = 4200;

const STAGE_BACKGROUND_MAP = {
  day: '/images/mypage/bot/matey-house-day.png',
  noon: '/images/mypage/bot/matey-house-noon.png',
  night: '/images/mypage/bot/matey-house-night.png',
};

const STAGE_MODE_META = {
  day: {
    chip: 'DAY MODE',
    text: '밝은 낮 배경이 적용되어 있어요.',
  },
  noon: {
    chip: 'NOON MODE',
    text: '포근한 정오 배경이 적용되어 있어요.',
  },
  night: {
    chip: 'NIGHT MODE',
    text: '차분한 밤 배경이 적용되어 있어요.',
  },
};

function getStageModeByHour(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 6 && hour < 11) return 'day';
  if (hour >= 11 && hour < 18) return 'noon';
  return 'night';
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DashboardContent({
  onInteractionSelect,
  intimacyLevel = 4,
  intimacyExp = 18,
  intimacyMaxExp = 100,
}) {
  const orbitAnchorRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const greetingHideTimerRef = useRef(null);
  const greetingPersistTimerRef = useRef(null);
  const previousModeRef = useRef(getStageModeByHour());

  const [stageMode, setStageMode] = useState(previousModeRef.current);
  const [fadeOutMode, setFadeOutMode] = useState(null);
  const [isOrbitOpen, setIsOrbitOpen] = useState(false);
  const [isGreetingVisible, setIsGreetingVisible] = useState(false);

  const prefersReducedMotion = usePrefersReducedMotion();

  const animatedIntimacyLevel = useAnimatedNumber(intimacyLevel, 900, {
    reducedMotion: prefersReducedMotion,
  });

  const animatedIntimacyExp = useAnimatedNumber(intimacyExp, 1100, {
    reducedMotion: prefersReducedMotion,
  });

  const animatedIntimacyPercent = useMemo(() => {
    if (!intimacyMaxExp || intimacyMaxExp <= 0) return 0;
    return Math.max(0, Math.min(100, (animatedIntimacyExp / intimacyMaxExp) * 100));
  }, [animatedIntimacyExp, intimacyMaxExp]);

  const interactionItems = useMemo(
    () => [
      {
        key: 'counsel',
        label: '상담하기',
        icon: '/images/mypage/bot/matey-counsel.png',
      },
      {
        key: 'play',
        label: '놀아주기',
        icon: '/images/mypage/bot/matey-play.png',
      },
      {
        key: 'feed',
        label: '먹이 주기',
        icon: '/images/mypage/bot/matey-feed.png',
      },
      {
        key: 'touch',
        label: '쓰다듬기',
        icon: '/images/mypage/bot/matey-pet.png',
      },
    ],
    []
  );

  const orbitPositionClassMap = useMemo(
    () => ({
      counsel: styles.orbitCounsel,
      play: styles.orbitPlay,
      feed: styles.orbitFeed,
      touch: styles.orbitTouch,
    }),
    []
  );

  const stageModeClassMap = useMemo(
    () => ({
      day: {
        chip: styles.stageModeDay,
        image: styles.backgroundImageDay,
        scrim: styles.backgroundScrimDay,
        glow: styles.stageGlowDay,
        floor: styles.stageFloorDay,
        character: styles.characterImageDay,
      },
      noon: {
        chip: styles.stageModeNoon,
        image: styles.backgroundImageNoon,
        scrim: styles.backgroundScrimNoon,
        glow: styles.stageGlowNoon,
        floor: styles.stageFloorNoon,
        character: styles.characterImageNoon,
      },
      night: {
        chip: styles.stageModeNight,
        image: styles.backgroundImageNight,
        scrim: styles.backgroundScrimNight,
        glow: styles.stageGlowNight,
        floor: styles.stageFloorNight,
        character: styles.characterImageNight,
      },
    }),
    []
  );

  const currentModeMeta = STAGE_MODE_META[stageMode];
  const currentModeClasses = stageModeClassMap[stageMode];
  const fadeOutModeClasses = fadeOutMode ? stageModeClassMap[fadeOutMode] : null;

  useEffect(() => {
    Object.values(STAGE_BACKGROUND_MAP).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setStageMode((current) => {
        const next = getStageModeByHour();
        return current === next ? current : next;
      });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const previousMode = previousModeRef.current;

    if (previousMode === stageMode) return;

    setFadeOutMode(previousMode);

    if (fadeTimerRef.current) {
      window.clearTimeout(fadeTimerRef.current);
    }

    fadeTimerRef.current = window.setTimeout(() => {
      setFadeOutMode(null);
    }, STAGE_FADE_DURATION);

    previousModeRef.current = stageMode;
  }, [stageMode]);

  useEffect(() => {
    let persistTimerId = null;

    try {
      const todayKey = getLocalDateKey();
      const lastSeenDate = window.localStorage.getItem(DAILY_GREETING_STORAGE_KEY);

      if (lastSeenDate !== todayKey) {
        setIsGreetingVisible(true);

        persistTimerId = window.setTimeout(() => {
          try {
            window.localStorage.setItem(DAILY_GREETING_STORAGE_KEY, todayKey);
          } catch (error) {
            /* noop */
          }
        }, 0);

        greetingPersistTimerRef.current = persistTimerId;
      }
    } catch (error) {
      setIsGreetingVisible(true);
    }

    return () => {
      if (persistTimerId) {
        window.clearTimeout(persistTimerId);
      }
    };
  }, []);

  useEffect(() => {
    if (!isGreetingVisible) return undefined;

    greetingHideTimerRef.current = window.setTimeout(() => {
      setIsGreetingVisible(false);
    }, DAILY_GREETING_DURATION);

    return () => {
      if (greetingHideTimerRef.current) {
        window.clearTimeout(greetingHideTimerRef.current);
      }
    };
  }, [isGreetingVisible]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
      }

      if (greetingHideTimerRef.current) {
        window.clearTimeout(greetingHideTimerRef.current);
      }

      if (greetingPersistTimerRef.current) {
        window.clearTimeout(greetingPersistTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOrbitOpen) return;

    const handlePointerDown = (event) => {
      if (!orbitAnchorRef.current?.contains(event.target)) {
        setIsOrbitOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOrbitOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOrbitOpen]);

  const handleCharacterToggle = () => {
    setIsGreetingVisible(false);
    setIsOrbitOpen((prev) => !prev);
  };

  const handleInteractionClick = (item) => {
    setIsGreetingVisible(false);
    onInteractionSelect?.(item.key);
    setIsOrbitOpen(false);
  };

  return (
    <div className={styles.page}>
      <section className={styles.stageCard}>
        <header className={styles.stageHeader}>
          <div className={styles.stageTitleGroup}>
            <span className={styles.stageEyebrow}>BOT STAGE</span>

            <div className={styles.stageHeadingRow}>
              <h2 className={styles.stageTitle}>메이티 상호작용 무대</h2>
              <span className={`${styles.stageModeChip} ${currentModeClasses.chip}`}>
                {currentModeMeta.chip}
              </span>
            </div>

            <p className={styles.stageModeText}>{currentModeMeta.text}</p>
          </div>
        </header>

        <div className={styles.stageCanvas}>
          <div className={styles.backgroundSlot} aria-hidden="true">
            <img
              src={STAGE_BACKGROUND_MAP[stageMode]}
              alt=""
              className={`${styles.backgroundImage} ${currentModeClasses.image} ${styles.layerVisible}`}
            />

            {fadeOutMode && fadeOutModeClasses && (
              <img
                src={STAGE_BACKGROUND_MAP[fadeOutMode]}
                alt=""
                className={`${styles.backgroundImageLayer} ${fadeOutModeClasses.image} ${styles.fadeOutLayer}`}
              />
            )}

            <div
              className={`${styles.backgroundScrim} ${currentModeClasses.scrim} ${styles.layerVisible}`}
            />

            {fadeOutMode && fadeOutModeClasses && (
              <div
                className={`${styles.backgroundScrimLayer} ${fadeOutModeClasses.scrim} ${styles.fadeOutLayer}`}
              />
            )}

            <div
              className={`${styles.stageGlow} ${currentModeClasses.glow} ${styles.layerVisible}`}
            />

            {fadeOutMode && fadeOutModeClasses && (
              <div
                className={`${styles.stageGlowLayer} ${fadeOutModeClasses.glow} ${styles.fadeOutLayer}`}
              />
            )}

            <div
              className={`${styles.stageFloor} ${currentModeClasses.floor} ${styles.layerVisible}`}
            />

            {fadeOutMode && fadeOutModeClasses && (
              <div
                className={`${styles.stageFloorLayer} ${fadeOutModeClasses.floor} ${styles.fadeOutLayer}`}
              />
            )}
          </div>

          <div className={styles.characterZone}>
            <div ref={orbitAnchorRef} className={styles.orbitAnchor}>
              {isGreetingVisible && (
                <div
                  className={styles.greetingBubble}
                  role="status"
                  aria-live="polite"
                  aria-label={DAILY_GREETING_TEXT}
                >
                  <div className={styles.greetingBubbleInner}>
                    <span className={styles.greetingBubbleText}>
                      {DAILY_GREETING_TEXT}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                className={styles.characterButton}
                onClick={handleCharacterToggle}
                aria-label="메이티 상호작용 메뉴 열기"
                aria-expanded={isOrbitOpen}
                aria-controls="matey-orbit-menu"
              >
                <img
                  src="/images/mypage/bot/matey-base.png"
                  alt="메이티 캐릭터"
                  className={`${styles.characterImage} ${currentModeClasses.character}`}
                />
              </button>

              <div
                id="matey-orbit-menu"
                className={`${styles.orbitMenu} ${isOrbitOpen ? styles.orbitMenuOpen : ''}`}
              >
                <div className={styles.orbitCenter}>
                  {interactionItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`${styles.orbitActionButton} ${orbitPositionClassMap[item.key]}`}
                      onClick={() => handleInteractionClick(item)}
                      aria-label={item.label}
                    >
                      <span className={styles.orbitIconWrap}>
                        <img src={item.icon} alt="" className={styles.orbitIcon} />
                      </span>
                      <span className={styles.orbitLabel}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.bondStatus} aria-live="polite">
                <div className={styles.bondStatusInner}>
                  <div className={styles.bondSection}>
                    <div className={styles.bondStatusHeader}>
                      <span className={styles.bondStatusTitle}>친밀도 LEVEL</span>
                      <strong className={styles.bondStatusLevel}>
                        Lv. {animatedIntimacyLevel}
                      </strong>
                    </div>

                    <div
                      className={styles.bondProgress}
                      role="progressbar"
                      aria-label="친밀도 경험치"
                      aria-valuemin={0}
                      aria-valuemax={intimacyMaxExp}
                      aria-valuenow={Math.min(animatedIntimacyExp, intimacyMaxExp)}
                    >
                      <div
                        className={styles.bondProgressFill}
                        style={{ width: `${animatedIntimacyPercent}%` }}
                      />
                    </div>

                    <div className={styles.bondStatusMeta}>
                      <span>경험치</span>
                      <span>
                        {animatedIntimacyExp} / {intimacyMaxExp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
