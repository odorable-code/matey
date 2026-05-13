import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './DashboardContent.module.css';
import useAnimatedNumber, { usePrefersReducedMotion } from '../hooks/useAnimatedNumber';
import { myPageAPI } from 'utils/api';
import { intimacyApiLevelToDisplay } from 'utils/intimacyDisplay';
import {
  resolveMateDisplayName,
  resolveMateKey,
  resolveMatePickerBlurb,
  resolveBotAvatarSrc,
  MATE_KEYS,
} from '../../../constants/mates';
import {
  collectDashboardStageMotionAssetUrls,
  filterMotionsForDashboardStage,
  normalizeMotionAssetUrl,
  pickRandomMotionAssetUrl,
} from 'utils/motionAssets';

/** 서버·캐시 어디서 오든 한 줄로 통일 */
function mapAssignableRow(entry) {
  if (entry == null || typeof entry !== 'object') return null;
  const botIdRaw = entry.botId ?? entry.bot_id ?? entry.BOT_ID ?? entry.id;
  if (botIdRaw == null || botIdRaw === '') return null;
  const n =
    typeof botIdRaw === 'number' && Number.isFinite(botIdRaw)
      ? botIdRaw
      : Number(String(botIdRaw).trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  const rawName = String(entry.name ?? '').trim();
  const dbLabel = String(entry.displayName ?? entry.display_name ?? '').trim();
  const fromApi = String(
    entry.shortDescription ?? entry.short_description ?? entry.blurb ?? entry.tagline ?? ''
  ).trim();
  const blurb =
    fromApi ||
    resolveMatePickerBlurb(rawName) ||
    resolveMatePickerBlurb(dbLabel);
  return {
    botId: n,
    name: dbLabel || resolveMateDisplayName(rawName, n),
    avatarImage: entry.avatarImage ?? entry.avatar_image ?? '',
    blurb,
  };
}

function normalizeAssignableBotsFromMenuPayload(data) {
  const raw = data?.assignableBots ?? data?.assignable_bots ?? data?.bots;
  if (!Array.isArray(raw)) return [];
  return raw.map(mapAssignableRow).filter(Boolean);
}

function mergeBotMenuIntoState(prev, patch) {
  if (!patch || typeof patch !== 'object') return prev;
  const merged = { ...prev, ...patch };
  const fromPatch = normalizeAssignableBotsFromMenuPayload(patch);
  merged.assignableBots =
    fromPatch.length > 0
      ? fromPatch
      : Array.isArray(prev.assignableBots) && prev.assignableBots.length > 0
        ? prev.assignableBots
        : normalizeAssignableBotsFromMenuPayload(merged);
  return merged;
}

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
    chip: '낮',
    text: '밝은 낮 분위기로 메이티 방이 열려 있어요.',
  },
  noon: {
    chip: '오후',
    text: '포근한 오후 빛이 비춰요.',
  },
  night: {
    chip: '밤',
    text: '조용한 밤, 편안한 무드예요.',
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

function shuffleDelaysMs(base) {
  const a = [...base];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/** 놀아주기·먹이주기·쓰다듬기 → BOT_MOTION.motion_code (대시보드는 L2 이하 모션만 후보) */
const INTERACTION_MOTION_CODES = {
  play: ['STRETCH', 'CURIOSITY', 'COMPLIMENTS', 'HELLO'],
  feed: ['COMPLIMENTS', 'GINGER', 'HELLO', 'WAITING'],
  touch: ['WAITING', 'COMPLIMENTS', 'HELLO', 'STRETCH'],
};

/** motion_code 미포함 응답용 — motion_name 과 동일한 시드 기준 */
const INTERACTION_MOTION_NAMES = {
  play: ['스트레칭', '호기심', '칭찬', '인사'],
  feed: ['칭찬', '진저', '인사', '기다림'],
  touch: ['기다림', '칭찬', '인사', '스트레칭'],
};

const INTERACTION_REACTION_MS = 3200;

function motionCodeFromRow(m) {
  return String(m?.motionCode ?? m?.motion_code ?? '').trim().toUpperCase();
}

function pickUnlockedMotionUrl(row) {
  if (!row || String(row.tag ?? '').trim() === '잠금') return '';
  return normalizeMotionAssetUrl(row.assetUrl ?? row.asset_url);
}

function pickMotionUrlForInteraction(motions, actionKey) {
  const codes = INTERACTION_MOTION_CODES[actionKey];
  const names = INTERACTION_MOTION_NAMES[actionKey];
  if (!Array.isArray(motions)) return '';
  if (codes) {
    for (const code of codes) {
      const c = code.toUpperCase();
      const row = motions.find((m) => {
        const mc = motionCodeFromRow(m);
        return Boolean(mc) && mc === c;
      });
      const u = pickUnlockedMotionUrl(row);
      if (u) return u;
    }
  }
  if (names) {
    for (const nm of names) {
      const row = motions.find((m) => String(m?.name ?? '').trim() === nm);
      const u = pickUnlockedMotionUrl(row);
      if (u) return u;
    }
  }
  return '';
}

const DASHBOARD_OWNED_MOTION_ROTATE_MS = 14_000;

export default function DashboardContent({
  onInteractionSelect,
}) {
  const orbitAnchorRef = useRef(null);
  const orbitHoverCloseTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const greetingHideTimerRef = useRef(null);
  const greetingPersistTimerRef = useRef(null);
  const previousModeRef = useRef(getStageModeByHour());

  const [stageMode, setStageMode] = useState(previousModeRef.current);
  const [fadeOutMode, setFadeOutMode] = useState(null);
  const [isOrbitOpen, setIsOrbitOpen] = useState(false);
  const [isGreetingVisible, setIsGreetingVisible] = useState(false);
  const [botData, setBotData] = useState({
    level: 1,
    remainPoint: 0,
    progressPercent: 0,
    assignableBots: [],
    feedDoneToday: false,
    motions: [],
  });
  const [botPickerOpen, setBotPickerOpen] = useState(false);
  const [botPickerListBusy, setBotPickerListBusy] = useState(false);
  const [botAssignSaving, setBotAssignSaving] = useState(false);
  const [botMenuReloadBusy, setBotMenuReloadBusy] = useState(false);
  /** 데스크톱만: 봇 영역 호버로 상호작용 메뉴 열기 */
  const [hoverMenuSupported, setHoverMenuSupported] = useState(false);
  /** 메뉴가 열릴 때마다 랜덤 스태거·살짝 비틀림 (모션 다이어트 시 비활성) */
  const [orbitOpenMotion, setOrbitOpenMotion] = useState({
    twistDeg: 0,
    delaysMs: [0, 0, 0, 0],
  });

  /** 대시보드 친밀도·담당봇 표시. bot-menu 응답의 assignableBots는 서버가 BOT 전체 목록을 내려주므로 그대로 반영 */
  const loadBotMenu = useCallback(() => {
    return myPageAPI
      .getBotMenu()
      .then((menu) => {
        if (!menu) return;
        setBotData((prev) => {
          const fromMenu = normalizeAssignableBotsFromMenuPayload(menu);
          const { assignableBots: _ab, assignable_bots: _ab2, ...menuRest } = menu;
          const assignableBots =
            fromMenu.length > 0
              ? fromMenu
              : Array.isArray(prev.assignableBots) && prev.assignableBots.length > 0
                ? prev.assignableBots
                : [];
          return { ...prev, ...menuRest, assignableBots };
        });
      })
      .catch(console.error);
  }, []);

  /** 담당봇 모달: 인증된 GET /api/mypage/bots/assignable 우선 (bot-menu 의 assignableBots 누락·파싱 이슈 회피) */
  const fetchAssignableBotsFromDb = useCallback(async () => {
    let rows = [];
    try {
      rows = await myPageAPI.getAssignableBots();
    } catch (e) {
      console.warn('getAssignableBots', e);
    }
    if (!Array.isArray(rows)) rows = [];
    let mapped = rows.map(mapAssignableRow).filter(Boolean);
    if (mapped.length > 0) {
      setBotData((prev) => ({ ...prev, assignableBots: mapped }));
      return;
    }
    try {
      const menu = await myPageAPI.getBotMenu();
      if (!menu) return;
      mapped = normalizeAssignableBotsFromMenuPayload(menu);
      const { assignableBots: _a, assignable_bots: _a2, ...menuRest } = menu;
      setBotData((prev) => ({
        ...prev,
        ...menuRest,
        assignableBots: mapped.length > 0 ? mapped : prev.assignableBots,
      }));
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, []);

  const handleOpenBotPicker = useCallback(async () => {
    setBotPickerOpen(true);
    setBotPickerListBusy(true);
    try {
      await fetchAssignableBotsFromDb();
    } catch (e) {
      window.alert(e?.message || '서버에서 봇 목록을 불러오지 못했어요.');
    } finally {
      setBotPickerListBusy(false);
    }
  }, [fetchAssignableBotsFromDb]);

  useEffect(() => {
    loadBotMenu();
  }, [loadBotMenu]);

  const prefersReducedMotion = usePrefersReducedMotion();

  const ownedMotionAssetUrls = useMemo(
    () => collectDashboardStageMotionAssetUrls(botData.motions ?? botData.motions_list),
    [botData.motions, botData.motions_list]
  );
  const ownedMotionAssetsKey = useMemo(() => ownedMotionAssetUrls.join('|'), [ownedMotionAssetUrls]);

  const [randomOwnedMotionSrc, setRandomOwnedMotionSrc] = useState(null);
  const ownedMotionUrlsRef = useRef([]);
  const interactionMotionTimerRef = useRef(null);
  const [interactionMotionSrc, setInteractionMotionSrc] = useState(null);

  useEffect(() => {
    ownedMotionUrlsRef.current = ownedMotionAssetUrls;
  }, [ownedMotionAssetUrls]);

  useEffect(() => {
    if (ownedMotionAssetUrls.length === 0) {
      setRandomOwnedMotionSrc(null);
      return;
    }
    setRandomOwnedMotionSrc(pickRandomMotionAssetUrl(ownedMotionAssetUrls, null) || null);
  }, [ownedMotionAssetsKey, ownedMotionAssetUrls]);

  useEffect(() => {
    if (ownedMotionAssetUrls.length < 2 || prefersReducedMotion) {
      return undefined;
    }
    const id = window.setInterval(() => {
      const urls = ownedMotionUrlsRef.current;
      if (urls.length < 2) return;
      setRandomOwnedMotionSrc((prev) => pickRandomMotionAssetUrl(urls, prev) || null);
    }, DASHBOARD_OWNED_MOTION_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [ownedMotionAssetUrls.length, ownedMotionAssetsKey, prefersReducedMotion]);

  const assignableBotsList = useMemo(() => {
    const raw = botData.assignableBots ?? botData.assignable_bots;
    if (!Array.isArray(raw)) return [];
    return raw
      .map(mapAssignableRow)
      .filter((b) => b && MATE_KEYS.includes(resolveMateKey(b.name)));
  }, [botData]);

  const clearOrbitHoverCloseTimer = useCallback(() => {
    if (orbitHoverCloseTimerRef.current != null) {
      window.clearTimeout(orbitHoverCloseTimerRef.current);
      orbitHoverCloseTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearOrbitHoverCloseTimer(), [clearOrbitHoverCloseTimer]);

  useEffect(
    () => () => {
      if (interactionMotionTimerRef.current != null) {
        window.clearTimeout(interactionMotionTimerRef.current);
        interactionMotionTimerRef.current = null;
      }
    },
    []
  );

  const intimacyMaxExp = 100;
  const intimacyLevel = intimacyApiLevelToDisplay(botData.level);
  const intimacyExp = botData.progressPercent || 0;

  const animatedIntimacyLevel = useAnimatedNumber(intimacyLevel, 900, {
    reducedMotion: prefersReducedMotion,
  });

  const animatedIntimacyExp = useAnimatedNumber(intimacyExp, 1100, {
    reducedMotion: prefersReducedMotion,
  });

  const animatedIntimacyPercent = useMemo(() => {
    return Math.max(0, Math.min(100, animatedIntimacyExp));
  }, [animatedIntimacyExp]);

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

  const characterImageSrc = useMemo(() => {
    if (interactionMotionSrc) return interactionMotionSrc;
    if (randomOwnedMotionSrc) return randomOwnedMotionSrc;
    return resolveBotAvatarSrc(botData);
  }, [interactionMotionSrc, randomOwnedMotionSrc, botData]);



  const handlePickAssignedBot = (botId) => {
    if (botId == null || botAssignSaving) return;
    setBotAssignSaving(true);
    myPageAPI
      .setAssignedBot(botId)
      .then((data) => {
        if (data) setBotData((prev) => mergeBotMenuIntoState(prev, data));
        setBotPickerOpen(false);
      })
      .catch((e) => {
        window.alert(e?.message || '담당 봇을 바꾸지 못했어요.');
      })
      .finally(() => {
        setBotAssignSaving(false);
      });
  };

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
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setHoverMenuSupported(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!isOrbitOpen) return;
    if (prefersReducedMotion) {
      setOrbitOpenMotion({ twistDeg: 0, delaysMs: [0, 0, 0, 0] });
      return;
    }
    const twistPool = [-8, -5, -3, 4, 6, 9];
    const twistDeg = twistPool[Math.floor(Math.random() * twistPool.length)];
    setOrbitOpenMotion({
      twistDeg,
      delaysMs: shuffleDelaysMs([0, 38, 76, 114]),
    });
  }, [isOrbitOpen, prefersReducedMotion]);

  const handleOrbitAnchorEnter = useCallback(() => {
    if (!hoverMenuSupported) return;
    clearOrbitHoverCloseTimer();
    setIsGreetingVisible(false);
    setIsOrbitOpen(true);
  }, [hoverMenuSupported, clearOrbitHoverCloseTimer]);

  const handleOrbitAnchorLeave = useCallback(() => {
    if (!hoverMenuSupported) return;
    clearOrbitHoverCloseTimer();
    orbitHoverCloseTimerRef.current = window.setTimeout(() => {
      setIsOrbitOpen(false);
      orbitHoverCloseTimerRef.current = null;
    }, 260);
  }, [hoverMenuSupported, clearOrbitHoverCloseTimer]);

  useEffect(() => {
    if (!isOrbitOpen) return;

    const handlePointerDown = (event) => {
      if (!orbitAnchorRef.current?.contains(event.target)) {
        clearOrbitHoverCloseTimer();
        setIsOrbitOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        clearOrbitHoverCloseTimer();
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
  }, [isOrbitOpen, clearOrbitHoverCloseTimer]);

  const handleCharacterToggle = () => {
    setIsGreetingVisible(false);
    clearOrbitHoverCloseTimer();
    setIsOrbitOpen((prev) => !prev);
  };

  const handleInteractionClick = (item) => {
    setIsGreetingVisible(false);
    clearOrbitHoverCloseTimer();

    if (item.key === 'feed' && botData.feedDoneToday) {
      window.alert('오늘은 이미 먹이를 줬어요. 내일 다시 와 줘!');
      setIsOrbitOpen(false);
      return;
    }

    // Call the API to trigger interaction
    myPageAPI
      .interactBot({ actionType: item.key })
      .then((updatedData) => {
        if (updatedData) {
          setBotData((prev) => mergeBotMenuIntoState(prev, updatedData));
        }
        const motions =
          (updatedData && Array.isArray(updatedData.motions) && updatedData.motions) ||
          (updatedData && Array.isArray(updatedData.motions_list) && updatedData.motions_list) ||
          [];
        if (['play', 'feed', 'touch'].includes(item.key)) {
          const url = pickMotionUrlForInteraction(
            filterMotionsForDashboardStage(motions),
            item.key
          );
          if (url) {
            setInteractionMotionSrc(url);
            if (interactionMotionTimerRef.current != null) {
              window.clearTimeout(interactionMotionTimerRef.current);
            }
            interactionMotionTimerRef.current = window.setTimeout(() => {
              setInteractionMotionSrc(null);
              interactionMotionTimerRef.current = null;
            }, INTERACTION_REACTION_MS);
          }
        }
      })
      .catch((err) => {
        if (err?.status === 409) {
          window.alert(String(err.message || '').trim() || '오늘은 이미 먹이를 줬어요.');
          setBotData((prev) => ({ ...prev, feedDoneToday: true }));
        } else {
          console.error(err);
        }
      });

    onInteractionSelect?.(item.key);
    setIsOrbitOpen(false);
  };

  return (
    <div className={styles.page}>
      <section className={styles.stageCard}>
        <header className={styles.stageHeader}>
          <div className={styles.stageTitleGroup}>
            <div className={styles.stageHeadingRow}>
              <h2 className={styles.stageTitle}>메이티와 함께하는 오늘</h2>
              <span className={`${styles.stageModeChip} ${currentModeClasses.chip}`}>
                {currentModeMeta.chip}
              </span>
            </div>

            <p className={styles.stageModeText}>{currentModeMeta.text}</p>
          </div>
          <div className={styles.stageHeaderActions}>
            <button
              type="button"
              className={styles.stageAssignButton}
              onClick={handleOpenBotPicker}
              disabled={botPickerListBusy}
              title="누르면 서버(DB의 BOT)에서 선택 가능한 봇 목록을 불러옵니다."
            >
              {botPickerListBusy ? '목록 불러오는 중…' : '담당봇 선택하기'}
            </button>
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
            <div
              ref={orbitAnchorRef}
              className={styles.orbitAnchor}
              onMouseEnter={handleOrbitAnchorEnter}
              onMouseLeave={handleOrbitAnchorLeave}
            >
              <div
                id="matey-orbit-menu"
                className={`${styles.orbitMenu} ${isOrbitOpen ? styles.orbitMenuOpen : ''} ${
                  isOrbitOpen && !prefersReducedMotion ? styles.orbitMenuMotion : ''
                }`}
              >
                <div
                  className={styles.orbitCenter}
                  style={{ '--orbit-twist': `${orbitOpenMotion.twistDeg}deg` }}
                >
                  {interactionItems.map((item, orbitIdx) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`${styles.orbitActionButton} ${orbitPositionClassMap[item.key]}`}
                      style={{ '--orbit-btn-delay': `${orbitOpenMotion.delaysMs[orbitIdx] ?? 0}ms` }}
                      onClick={() => handleInteractionClick(item)}
                      disabled={item.key === 'feed' && Boolean(botData.feedDoneToday)}
                      title={
                        item.key === 'feed' && botData.feedDoneToday
                          ? '오늘은 이미 먹이를 줬어요. 내일 다시 와 줘!'
                          : undefined
                      }
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

              <button
                type="button"
                className={`${styles.characterButton} ${
                  isGreetingVisible && !isOrbitOpen
                    ? styles.characterButtonGreetingLift
                    : ''
                }`.trim()}
                onClick={handleCharacterToggle}
                aria-label="담당 봇과 상호작용 메뉴 열기"
                aria-expanded={isOrbitOpen}
                aria-controls="matey-orbit-menu"
              >
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
                <img
                  key={characterImageSrc}
                  src={characterImageSrc}
                  alt="담당 상담봇"
                  className={`${styles.characterImage} ${currentModeClasses.character}`}
                />
              </button>
            </div>
          </div>

          <div className={styles.stageBottomDock}>
            <div className={styles.bondStatus} aria-live="polite">
              <div className={styles.bondStatusInner}>
                <div
                  className={styles.bondRow}
                  role="group"
                  aria-label={`친밀도 레벨 ${animatedIntimacyLevel}, 경험치 ${animatedIntimacyExp} 중 ${intimacyMaxExp}`}
                >
                  <div className={styles.bondLabelGroup}>
                    <span className={styles.bondStatusTitle}>친밀도</span>
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
                  <span className={styles.bondExpCapsule} aria-hidden="true">
                    {animatedIntimacyExp}/{intimacyMaxExp}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {botPickerOpen ? (
        <div
          className={styles.botPickerOverlay}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setBotPickerOpen(false);
          }}
        >
          <div
            className={styles.botPickerDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="matey-bot-picker-title"
          >
            <div className={styles.botPickerHead}>
              <h3 id="matey-bot-picker-title" className={styles.botPickerTitle}>
                담당 봇 선택
              </h3>
              <button
                type="button"
                className={styles.botPickerClose}
                onClick={() => setBotPickerOpen(false)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <p className={styles.botPickerHint}>
              {botPickerListBusy
                ? '불러오는 중…'
                : assignableBotsList.length > 0
                  ? '누른 봇이 담당으로 바뀌어요.'
                  : '목록을 불러오지 못했어요.'}
            </p>
            {botPickerListBusy ? (
              <p className={styles.botPickerEmptyLead} style={{ textAlign: 'center', marginTop: 8 }}>
                잠시만요…
              </p>
            ) : assignableBotsList.length > 0 ? (
              <ul className={styles.botPickerList}>
                {assignableBotsList.map((b) => {
                  const id = b.botId ?? b.bot_id;
                  return (
                    <li key={id} className={styles.botPickerItem}>
                      <button
                        type="button"
                        className={styles.botPickerCard}
                        disabled={botAssignSaving}
                        onClick={() => handlePickAssignedBot(id)}
                      >
                        <img
                          src={resolveBotAvatarSrc({
                            botAvatarImage: b.avatarImage ?? b.avatar_image,
                            botName: b.name,
                          })}
                          alt=""
                          className={styles.botPickerThumb}
                        />
                        <span className={styles.botPickerMeta}>
                          <span className={styles.botPickerName}>{b.name}</span>
                          {b.blurb ? (
                            <span className={styles.botPickerBlurb}>{b.blurb}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className={styles.botPickerEmpty}>
                <p className={styles.botPickerEmptyLead}>다시 불러오기를 눌러 주세요.</p>
                <p className={styles.botPickerEmptySub}>안 되면 로그아웃 후 다시 들어와 주세요.</p>
                <div className={styles.botPickerEmptyActions}>
                  <button
                    type="button"
                    className={styles.botPickerRetry}
                    disabled={botMenuReloadBusy}
                    onClick={() => {
                      setBotMenuReloadBusy(true);
                      void loadBotMenu();
                      fetchAssignableBotsFromDb()
                        .catch((e) => {
                          window.alert(e?.message || '목록을 다시 불러오지 못했어요.');
                        })
                        .finally(() => setBotMenuReloadBusy(false));
                    }}
                  >
                    {botMenuReloadBusy ? '불러오는 중…' : '다시 불러오기'}
                  </button>
                  <button
                    type="button"
                    className={styles.botPickerEmptyClose}
                    onClick={() => setBotPickerOpen(false)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
