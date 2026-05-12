import React, { useEffect, useState, useMemo } from 'react';
import styles from './BotMenuContent.module.css';
import useAnimatedNumber, { usePrefersReducedMotion } from '../hooks/useAnimatedNumber';
import { myPageAPI } from '../../../utils/api';
import { intimacyApiLevelToDisplay } from '../../../utils/intimacyDisplay';
import { normalizeMotionAssetUrl } from '../../../utils/motionAssets';
import { resolveBotAvatarSrc, resolveMateDisplayName } from '../../../constants/mates';

const defaultBotData = {
  level: 1,
  remainPoint: 100,
  progressPercent: 0,
  summaryCards: [],
  backgrounds: [],
  motions: [],
};

function extractAnimatedText(value) {
  const text = value == null ? '' : String(value);
  const match = text.match(/(\d+(?:\.\d+)?)/);

  if (!match) {
    return {
      raw: text,
      hasNumber: false,
      prefix: text,
      number: 0,
      suffix: '',
    };
  }

  const numberText = match[1];
  const startIndex = match.index ?? 0;
  const endIndex = startIndex + numberText.length;

  return {
    raw: text,
    hasNumber: true,
    prefix: text.slice(0, startIndex),
    number: Number(numberText),
    suffix: text.slice(endIndex),
  };
}

function AnimatedSummaryCard({ item, prefersReducedMotion }) {
  const valueMeta = useMemo(() => extractAnimatedText(item.value), [item.value]);
  const noteMeta = useMemo(() => extractAnimatedText(item.note), [item.note]);

  const animatedValue = useAnimatedNumber(valueMeta.number, 1200, {
    reducedMotion: prefersReducedMotion,
  });

  const animatedNoteValue = useAnimatedNumber(noteMeta.number, 1000, {
    reducedMotion: prefersReducedMotion,
  });

  const renderedValue = valueMeta.hasNumber
    ? `${valueMeta.prefix}${animatedValue}${valueMeta.suffix}`
    : valueMeta.raw;

  const renderedNote = noteMeta.hasNumber
    ? `${noteMeta.prefix}${animatedNoteValue}${noteMeta.suffix}`
    : noteMeta.raw;

  return (
    <article className={styles.summaryCard}>
      <span className={styles.summaryTitle}>{item.title}</span>
      <strong className={styles.summaryValue}>{renderedValue}</strong>
      <p className={styles.summaryNote}>{renderedNote}</p>
    </article>
  );
}

function backgroundStateClass(state) {
  if (state === '사용 중') return styles.gameTileStateActive;
  if (state === '잠금') return styles.gameTileStateLocked;
  return styles.gameTileStateOwned;
}

function BotMenuContent() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [botData, setBotData] = useState(defaultBotData);
  const [collectionTab, setCollectionTab] = useState('background');

  useEffect(() => {
    myPageAPI.getBotMenu()
      .then((data) => {
        if (data) {
          setBotData((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(console.error);
  }, []);

  const botAvatarSrc = useMemo(
    () => resolveBotAvatarSrc(botData),
    [botData.botAvatarImage, botData.botName, botData.bot_avatar_image, botData.bot_name]
  );
  const botDisplayName = useMemo(
    () => resolveMateDisplayName(botData.botName ?? botData.bot_name, botData.botId),
    [botData.botName, botData.bot_name, botData.botId]
  );

  const displayLevel = intimacyApiLevelToDisplay(botData.level);
  const animatedLevel = useAnimatedNumber(displayLevel, 900, {
    reducedMotion: prefersReducedMotion,
  });

  const animatedRemainPoint = useAnimatedNumber(botData.remainPoint ?? 0, 1100, {
    reducedMotion: prefersReducedMotion,
  });

  const animatedProgressPercent = useAnimatedNumber(botData.progressPercent ?? 0, 1200, {
    reducedMotion: prefersReducedMotion,
  });

  const clampedProgressPercent = useMemo(() => {
    return Math.max(0, Math.min(100, animatedProgressPercent));
  }, [animatedProgressPercent]);

  const backgrounds = botData.backgrounds ?? [];
  const motions = botData.motions ?? [];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>BOT MENU</span>
          <h2 className={styles.title}>봇 메뉴</h2>
          <p className={styles.description}>
            메이티의 상태와 컬렉션을 한 번에 보기 쉽게 정리했어요.
          </p>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <section className={styles.profileStrip} aria-label="담당 봇과 친밀도">
          <div className={styles.profileAvatarWrap}>
            <span className={styles.profileAvatarGlow} aria-hidden />
            <img
              src={botAvatarSrc}
              alt=""
              className={styles.profileAvatarImg}
            />
          </div>
          <div className={styles.profileStats}>
            <span className={styles.profileLabel}>INTIMACY</span>
            <div className={styles.profileNameRow}>
              <p className={styles.profileBotName}>{botDisplayName || '메이티'}</p>
              <span className={styles.profileLevelBadge}>Lv. {animatedLevel}</span>
            </div>
            <p className={styles.profileXpNote}>
              다음 레벨까지 <strong>{animatedRemainPoint}</strong> 포인트
            </p>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="친밀도 진행도"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={clampedProgressPercent}
            >
              <div
                className={styles.progressFill}
                style={{ width: `${clampedProgressPercent}%` }}
              />
            </div>
          </div>
        </section>

        {(botData.summaryCards ?? []).length > 0 ? (
          <div className={styles.summaryRow}>
            {(botData.summaryCards ?? []).map((item) => (
              <AnimatedSummaryCard
                key={item.title}
                item={item}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        ) : null}

        <section className={styles.collectionPanel} aria-label="컬렉션">
          <div className={styles.collectionTabBar} role="tablist" aria-label="컬렉션 종류">
            <button
              type="button"
              role="tab"
              id="botmenu-tab-bg"
              aria-selected={collectionTab === 'background'}
              aria-controls="botmenu-panel-bg"
              className={`${styles.collectionTab} ${collectionTab === 'background' ? styles.collectionTabActive : ''}`}
              onClick={() => setCollectionTab('background')}
            >
              배경 컬렉션
            </button>
            <button
              type="button"
              role="tab"
              id="botmenu-tab-motion"
              aria-selected={collectionTab === 'motion'}
              aria-controls="botmenu-panel-motion"
              className={`${styles.collectionTab} ${collectionTab === 'motion' ? styles.collectionTabActive : ''}`}
              onClick={() => setCollectionTab('motion')}
            >
              모션 컬렉션
            </button>
          </div>

          {collectionTab === 'background' ? (
            <div
              id="botmenu-panel-bg"
              role="tabpanel"
              aria-labelledby="botmenu-tab-bg"
              className={styles.gameInventoryGrid}
            >
              {backgrounds.map((item) => {
                const locked = item.state === '잠금';
                const imgUrl = normalizeMotionAssetUrl(item.imageUrl ?? item.image_url);
                const key = item.backgroundId ?? item.background_id ?? item.name;
                return (
                  <article
                    key={key}
                    className={`${styles.gameTile} ${locked ? styles.gameTileLocked : ''}`}
                  >
                    {locked ? (
                      <span className={styles.gameTileLockBadge} aria-hidden>🔒</span>
                    ) : null}
                    <div className={styles.gameTileMedia}>
                      {imgUrl ? (
                        <img src={imgUrl} alt="" className={styles.gameTileImg} />
                      ) : (
                        <div className={styles.gameTilePlaceholder} aria-hidden />
                      )}
                    </div>
                    <div className={styles.gameTileFooter}>
                      <h3 className={styles.gameTileName}>{item.name}</h3>
                      <span className={`${styles.gameTileState} ${backgroundStateClass(item.state)}`}>
                        {item.state}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {collectionTab === 'motion' ? (
            <div
              id="botmenu-panel-motion"
              role="tabpanel"
              aria-labelledby="botmenu-tab-motion"
              className={`${styles.gameInventoryGrid} ${styles.motionInventoryGrid}`}
            >
              {motions.map((item, idx) => {
                const tag = String(item.tag ?? '').trim();
                const locked = tag === '잠금';
                const showCornerPill = !locked && (tag === '기본' || tag === '보유');
                const unlockRaw = item.unlockIntimacyLevel ?? item.unlock_intimacy_level;
                const unlockLv = Number(unlockRaw);
                const imgUrl = normalizeMotionAssetUrl(
                  item.assetUrl ?? item.asset_url ?? item.AssetUrl
                );
                return (
                  <article
                    key={`${item.name}-${idx}`}
                    className={`${styles.gameTile} ${locked ? styles.gameTileLocked : ''}`}
                  >
                    {locked ? (
                      <span className={styles.gameTileLockBadge} aria-hidden>🔒</span>
                    ) : null}
                    {showCornerPill ? (
                      <span
                        className={`${styles.motionCornerPill} ${tag === '기본' ? styles.motionCornerPillDefault : styles.motionCornerPillOwned}`}
                      >
                        {tag}
                      </span>
                    ) : null}
                    <div className={styles.gameTileMedia}>
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt=""
                          className={`${styles.gameTileImg} ${styles.gameTileImgMotion}`}
                        />
                      ) : (
                        <div className={styles.gameTilePlaceholder} aria-hidden />
                      )}
                    </div>
                    <div className={styles.gameTileFooter}>
                      {locked ? (
                        <div className={styles.gameTileMotionFooterRow}>
                          <h3 className={styles.gameTileName}>{item.name}</h3>
                          <span className={styles.gameTileUnlockLevel}>
                            해금레벨{' '}
                            {Number.isFinite(unlockLv) && unlockLv > 0 ? unlockLv : '—'}
                          </span>
                        </div>
                      ) : (
                        <h3 className={styles.gameTileName}>{item.name}</h3>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}

export default BotMenuContent;
