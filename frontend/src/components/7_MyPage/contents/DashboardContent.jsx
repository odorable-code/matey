import React, { useMemo, useState } from 'react';
import styles from './DashboardContent.module.css';

const interactionItems = [
  {
    key: 'feed',
    label: '먹이주기',
    shortLabel: '먹이',
    icon: '/icons/mypage-feed.png',
  },
  {
    key: 'pet',
    label: '쓰다듬기',
    shortLabel: '터치',
    icon: '/icons/mypage-pet.png',
  },
  {
    key: 'play',
    label: '놀아주기',
    shortLabel: '놀이',
    icon: '/icons/mypage-play.png',
  },
  {
    key: 'counsel',
    label: '고민상담',
    shortLabel: '상담',
    icon: '/icons/mypage-counsel.png',
  },
];

const orbitPositionClassMap = {
  feed: 'orbitTop',
  pet: 'orbitRight',
  play: 'orbitBottom',
  counsel: 'orbitLeft',
};

function DashboardContent({ onInteractionSelect }) {
  const [isOrbitOpen, setIsOrbitOpen] = useState(false);

  const stageData = useMemo(
    () => ({
      backgroundImage: '',
      characterImage: '/images/rabbit.png',
    }),
    []
  );

  const handleInteractionClick = (key) => {
    if (typeof onInteractionSelect === 'function') {
      onInteractionSelect(key);
    }
  };

  const handleOrbitOpen = () => {
    setIsOrbitOpen(true);
  };

  const handleOrbitClose = () => {
    setIsOrbitOpen(false);
  };

  const handleCharacterBlur = () => {
    window.setTimeout(() => {
      setIsOrbitOpen(false);
    }, 120);
  };

  return (
    <section className={styles.page}>
      <article className={styles.stageCard}>
        <div className={styles.stageHeader} data-reveal-skip="true">
          <div className={styles.stageTitleGroup}>
            <span className={styles.stageEyebrow}>BOT STAGE</span>
            <h2 className={styles.stageTitle}>메이티 상호작용 무대</h2>
          </div>

          <div className={styles.stageIconRail}>
            {interactionItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={styles.stageIconButton}
                aria-label={item.label}
                title={item.label}
                onClick={() => handleInteractionClick(item.key)}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className={styles.stageIconImage}
                />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.stageCanvas} data-reveal-skip="true">
          <div className={styles.backgroundSlot}>
            {stageData.backgroundImage ? (
              <img
                src={stageData.backgroundImage}
                alt="메이티 배경"
                className={styles.backgroundImage}
              />
            ) : null}
          </div>

          <div className={styles.stageGlow} />
          <div className={styles.stageFloor} />

          <div
            className={styles.characterZone}
            onMouseEnter={handleOrbitOpen}
            onMouseLeave={handleOrbitClose}
          >
            <div className={styles.orbitAnchor}>
              <button
                type="button"
                className={styles.characterButton}
                onFocus={handleOrbitOpen}
                onBlur={handleCharacterBlur}
                aria-label="메이티 상호작용 열기"
              >
                <img
                  src={stageData.characterImage}
                  alt="메이티 캐릭터"
                  className={styles.characterImage}
                />
              </button>

              <div
                className={`${styles.orbitMenu} ${
                  isOrbitOpen ? styles.orbitMenuOpen : ''
                }`}
              >
                {interactionItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.orbitActionButton} ${
                      styles[orbitPositionClassMap[item.key]]
                    }`}
                    onClick={() => handleInteractionClick(item.key)}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <span className={styles.orbitIconWrap}>
                      <img
                        src={item.icon}
                        alt={item.label}
                        className={styles.orbitIcon}
                      />
                    </span>
                    <span className={styles.orbitLabel}>{item.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

export default DashboardContent;
